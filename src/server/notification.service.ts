import { Observable, empty as emptyObservable } from 'rxjs';
import { RxHR } from '@akanass/rx-http-request';

export default class NotificationService {

  public static postChat (text: string) {
    if (!process.env.CHAT_WEBHOOK_URL) {
      return emptyObservable();
    }
    return RxHR.post(process.env.CHAT_WEBHOOK_URL, {
      method: 'POST',
      json: true,
      body: {
        text
      }
    }).subscribe();
  }

}
