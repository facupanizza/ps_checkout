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
import { HtmlElementPs1_7Service } from '../../service/html-element-ps1_7.service';
import { PaypalService } from '../../service/paypal.service';
import { PsCheckoutService } from '../../service/ps-checkout.service';

import { NotificationComponent } from '../1_7/notification.component';
import { PaymentOptionsComponent } from '../1_7/payment-options.component';
import { ConditionsCheckboxComponent } from '../1_7/conditions-checkbox.component';
import { TranslationService } from '../../service/translation.service';
import { LoaderComponent } from '../common/loader.component';

export class PsCheckoutPs1_7Component {
  /**
   * @param {PsCheckoutConfig} config
   * @param {PayPalSdk} sdk
   */
  constructor(config, sdk) {
    this.config = config;
    this.sdk = sdk;

    this.translationService = new TranslationService(this.config.translations);

    this.htmlElementService = new HtmlElementPs1_7Service();
    this.payPalService = new PaypalService(
      this.sdk,
      this.config,
      this.translationService
    );
    this.psCheckoutService = new PsCheckoutService(
      this.config,
      this.translationService
    );

    this.$ = id => this.translationService.getTranslationString(id);

    this.children = {};
  }

  render() {
    if (document.body.id !== 'checkout') return;
    if (
      document
        .getElementById('checkout-payment-step')
        .classList.contains('-unreachable')
    )
      return;

    if (undefined === this.sdk) {
      throw new Error(this.$('error.paypal-sdk'));
    }

    this.children.loader = new LoaderComponent(this).render();
    this.children.conditionsCheckbox = new ConditionsCheckboxComponent(
      this
    ).render();

    this.children.notification = new NotificationComponent(this).render();
    this.children.paymentOptions = new PaymentOptionsComponent(this).render();
  }
}
