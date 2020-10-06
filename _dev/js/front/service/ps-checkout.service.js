/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 */
import {
  PS_VERSION_1_6,
  PS_VERSION_1_7
} from '../constants/ps-version.constants';

export class PsCheckoutService {
  constructor(config, translationService) {
    this.config = config;
    this.translationService = translationService;

    this.$ = id => this.translationService.getTranslationString(id);
  }

  isUserLogged() {
    return window.prestashop.customer.is_logged;
  }

  getProductDetails() {
    return JSON.parse(
      document.getElementById('product-details').dataset.product
    );
  }

  addToken(url) {
    const urlObject = new URL(url);
    urlObject.searchParams.append('static_token', this.config.staticToken);

    return urlObject.toString();
  }

  postCancelOrder(data) {
    return fetch(this.addToken(this.config.cancelUrl), {
      method: 'post',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(response => {
      if (false === response.ok) {
        throw new Error(response.statusText);
      }
    });
  }

  postCheckCartOrder(data, actions) {
    return this.config.orderId
      ? fetch(this.addToken(this.config.checkCartUrl), {
          method: 'post',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(data)
        })
          .then(response => {
            if (false === response.ok) {
              throw new Error(response.statusText);
            }

            return response.json();
          })
          .then(data => {
            if (!data) {
              return actions.reject();
            } else {
              return actions.resolve();
            }
          })
      : Promise.resolve().then(() => actions.resolve());
  }

  /**
   * @param {*} [data]
   * @returns {Promise<any>}
   */
  postCreateOrder(data) {
    return fetch(this.addToken(this.config.createUrl), {
      method: 'post',
      headers: {
        'content-type': 'application/json'
      },
      ...(data ? { body: JSON.stringify(data) } : {})
    })
      .then(response => {
        if (false === response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      })
      .then(({ body: { orderID } }) => orderID);
  }

  postGetToken() {
    return fetch(this.addToken(this.config.getTokenUrl), {
      method: 'post',
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(response => {
        if (false === response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      })
      .then(({ body: { token } }) => token);
  }

  postValidateOrder(data, actions) {
    return fetch(this.addToken(this.config.validateOrderUrl), {
      method: 'post',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (false === response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      })
      .then(response => {
        if (response.body && 'COMPLETED' === response.body.paypal_status) {
          const {
            id_cart,
            id_module,
            id_order,
            secure_key,
            paypal_order,
            paypal_transaction
          } = response.body;

          const confirmationUrl = new URL(this.config.confirmationUrl);
          confirmationUrl.searchParams.append('id_cart', id_cart);
          confirmationUrl.searchParams.append('id_module', id_module);
          confirmationUrl.searchParams.append('id_order', id_order);
          confirmationUrl.searchParams.append('key', secure_key);
          confirmationUrl.searchParams.append('paypal_order', paypal_order);
          confirmationUrl.searchParams.append(
            'paypal_transaction',
            paypal_transaction
          );

          window.location.href = confirmationUrl.toString();
        }

        if (response.error && 'INSTRUMENT_DECLINED' === response.error) {
          return actions.restart();
        }
      });
  }

  postExpressCheckoutOrder(data, actions) {
    return actions.order.get().then(({ payer, purchase_units }) =>
      fetch(this.addToken(this.config.expressCheckoutUrl), {
        method: 'post',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          order: {
            payer: payer,
            shipping: purchase_units[0].shipping
          }
        })
      }).then(response => {
        if (false === response.ok) {
          throw new Error(response.statusText);
        }
      })
    );
  }

  validateLiablityShift(liabilityShift) {
    if (undefined === liabilityShift) {
      console.log('Hosted fields : Liability is undefined.');
      return Promise.resolve();
    }

    if (false === liabilityShift) {
      console.log('Hosted fields : Liability is false.');
      return Promise.reject(
        new Error(this.$('error.paypal-sdk.liability.false'))
      );
    }

    if ('Possible' === liabilityShift) {
      console.log('Hosted fields : Liability might shift to the card issuer.');
      return Promise.resolve();
    }

    if ('No' === liabilityShift) {
      console.log('Hosted fields : Liability is with the merchant.');
      return Promise.resolve();
    }

    if ('Unknown' === liabilityShift) {
      console.log(
        'Hosted fields : The authentication system is not available.'
      );
      return Promise.resolve();
    }

    if (liabilityShift) {
      console.log('Hosted fields : Liability might shift to the card issuer.');
      return Promise.resolve();
    }

    console.log('Hosted fields : Liability unknown.');
    return Promise.reject(
      new Error(this.$('error.paypal-sdk.liability.unknown'))
    );
  }

  static getPrestashopVersion() {
    if (!window.prestashop) {
      return PS_VERSION_1_6;
    }

    return PS_VERSION_1_7;
  }
}
