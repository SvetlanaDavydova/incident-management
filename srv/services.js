const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));

    this.before("CREATE", "Customers", (req) => this.validateCustomerName(req));

    this.on("tryDestination", async (req) => {
      const remoteService = await cds.connect.to('ExternalService');

      return await remoteService.tx(req).run(SELECT.from('Products').limit(5));
    })

    return super.init();
  }

  changeUrgencyDueToSubject(data) {
    console.log(1);
    let urgent = data.title?.match(/urgent/i)
    if (urgent) data.urgency_code = 'H'
  }

  /** Custom Validation */
  async onUpdate (req) {
    let closed = await SELECT.one(1) .from (req.subject) .where `status.code = 'C'`
    if (closed) req.reject `Can't modify a closed incident!`
  }

  async validateCustomerName(req) {
    console.log(2)
    const existingCustomer = await SELECT.one(1). from(req.subject).where `Customers.firstName = ${req.data.name}`;
    if (existingCustomer) req.reject('Can not create such a customer');
  }
}
module.exports = { ProcessorService }
