const env = process.env;

export default {
  root: env.ROOT,
  salesforce: {
    url: env.SALESFORCE_URL,
    auth: {
      user: env.SALESFORCE_USER,
      pass: env.SALESFORCE_PASS
    },
    endpoints: {
      reservation: env.SALESFORCE_ENDPOINTS_RESERVATION,
      confirm: env.SALESFORCE_ENDPOINTS_CONFIRM
    }
  },
  mailchimp: {
    api_key: env.MAILCHIMP_API_KEY,
    store_id: env.MAILCHIMP_STORE_ID,
    list_id: env.MAILCHIMP_LIST_ID,
  },
  mollie: {
    api_key: env.MOLLIE_API_KEY
  },
  applicationinsights: {
    api_key: env.APPLICATIONINSIGHTS_API_KEY
  }
}
