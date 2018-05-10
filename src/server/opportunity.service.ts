
import {map} from 'rxjs/operators';
import { RxHR } from '@akanass/rx-http-request';
import SETTINGS from './settings';

export default class OpportunityService {

  public static confirm(OpportunityId: string) {
    return RxHR.post(SETTINGS.salesforce.endpoints.confirm, {
      method: 'POST',
      json: true,
      body: {
        OpportunityId
      }
    }).pipe(map((data: any) => {
      if (data.response.statusCode != 200) {
        throw new Error(JSON.stringify(data.body));
      }

      return data;
    }));
  }

}
