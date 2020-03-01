import "jsforce";
import { SObject } from "jsforce";

import { Campaign } from "../models/campaign";
import { Opportunity } from "../models/opportunity";
import { Contact } from "../models/contact";
import { OpportunityLineItem } from "../models/opportunity-line-item";
import { PricebookEntry } from "../models/pricebook-entry";

declare module "jsforce" {
  interface Connection {
    sobject(type: "Campaign"): SObject<Campaign>;
    sobject(type: "Opportunity"): SObject<Opportunity>;
    sobject(type: "Contact"): SObject<Contact>;
    sobject(type: "OpportunityLineItem"): SObject<OpportunityLineItem>;
    sobject(type: "PricebookEntry"): SObject<PricebookEntry>;
  }
}
