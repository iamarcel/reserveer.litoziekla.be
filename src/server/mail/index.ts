
import {of as observableOf, zip as observableZip,  Observable } from 'rxjs';

import {tap, filter, switchMap} from 'rxjs/operators';
import * as Mailchimp from 'mailchimp-api-v3';







import { RxHR } from '@akanass/rx-http-request';
import * as md5 from 'blueimp-md5';

import { Contact } from '../../models/contact';
import { Opportunity } from '../../models/opportunity';
import { OpportunityLineItem } from '../../models/opportunity-line-item';
import { Product2 } from '../../models/product2';
import { PricebookEntry } from '../../models/pricebook-entry';
import { Reservation } from '../../models/reservation';

import SETTINGS from '../settings';

export default class Mail {

  public static mail: Mail;

  private mailchimp;
  private storePath: string;
  private listPath: string;
  private request: typeof RxHR;

  public static setup (api_key: string, store_id: string, list_id: string) {
    Mail.mail = new Mail(api_key, store_id, list_id);
    return Mail.mail;
  }

  constructor (private api_key: string, private store_id: string, list_id: string) {
    this.mailchimp = new Mailchimp(api_key);
    this.storePath = `https://us9.api.mailchimp.com/3.0/ecommerce/stores/${store_id}`;
    this.listPath = `https://us9.api.mailchimp.com/3.0/lists/${list_id}`;
    this.request = RxHR.defaults({
      headers: {
        Authorization: `apikey ${this.api_key}`,
      },
      json: true,
    });
  }

  public findCustomer(email: string) {
    return this.request.get(`${this.storePath}/customers`, {
      qs: {
        email_address: email,
      },
    });
  }

  public addCustomer(contact: Contact) {
    return this.request.post(
      `${this.storePath}/customers`, {
      body: {
        id: contact.Id,
        email_address: contact.Email,
        opt_in_status: true,
        first_name: contact.FirstName,
        last_name: contact.LastName,
      }
    })
  }

  public upsertCustomer(contact: Contact) {
    return this.findCustomer(contact.Email).pipe(
      filter((response: any) => response.total_items >= 1),
      switchMap(() => this.addCustomer(contact)), );
  }

  public upsertProduct(entry: PricebookEntry) {
    return this.request.get(
      `${this.storePath}/products/${entry.Product2.Id}`).pipe(
        switchMap((data: any) => {
        const result = data.body;
        const mcProduct = {
          id: entry.Product2.Id,
          title: entry.Product2.Name,
          variants: [{
            id: entry.Id,
            title: entry.Name,
            price: entry.UnitPrice
          }]
        };

        if (data.response.statusCode == 200) {
          console.log(`[LOG] Patching ${entry.Product2.Name}`);
          return this.request.patch(
            `${this.storePath}/products/${entry.Product2.Id}`, {
              body: mcProduct
            });
        } else {
          console.log(`[LOG] Creating ${entry.Product2.Name}`);
          return this.request.post(
            `${this.storePath}/products`, {
              body: mcProduct
            });
        }
      }));
  }

  public insertReservation(
    reservation: Reservation,
    opportunity: Opportunity,
    contact: Contact,
    lines: OpportunityLineItem[],
    entries: PricebookEntry[],
    orderUrl: string,
  ) {
    return observableZip(
      observableOf(true).pipe(
        filter(() => reservation.OptIn === true),
        switchMap(
          () => this.request.put(
            `${this.listPath}/members/${md5(contact.Email.toLowerCase())}`, {
              body: {
                email_address: contact.Email,
                status: 'pending',
                merge_fields: {
                  FNAME: contact.FirstName,
                  LNAME: contact.LastName
                }
              }
            })), ),
      this.request.post(
        `${this.storePath}/orders`, {
          body: {
            id: opportunity.Id,
            landing_site: SETTINGS.root,
            financial_status: 'pending',
            fullfillment_status: '',
            customer: {
              id: contact.Id,
              email_address: contact.Email,
              first_name: contact.FirstName,
              last_name: contact.LastName,
              opt_in_status: false,
            },
            currency_code: 'EUR',
            order_total: reservation.totalPrice,
            order_url: orderUrl,
            lines: lines.map(l => ({
              id: l.Id,
              product_id: entries.find(entry => entry.Id === l.PricebookEntryId).Product2Id,
              product_variant_id: l.PricebookEntryId,
              quantity: l.Quantity,
              price: l.UnitPrice
            }))
          }
        }).pipe(
        tap(data => console.log(`[LOG] Added opportunity ${opportunity.Id} in Mailchimp`))),
      (listResponse, orderResponse) => listResponse
    );
  }

  public confirmPayment(orderId: string) {
    return this.request.patch(
      `${this.storePath}/orders/${orderId}`, {
        body: {
          financial_status: 'paid',
        },
      });
  }

}
