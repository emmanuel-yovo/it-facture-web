const { FedaPay, Transaction } = require('fedapay');

FedaPay.setApiKey('sk_sandbox_c8BBbh7dSYeShCZTof48_UFa');
FedaPay.setEnvironment('sandbox');

async function test() {
  try {
    const transaction = await Transaction.create({
      description: 'Paiement de la facture TEST',
      amount: 500,
      currency: { iso: 'XOF' },
      callback_url: 'http://localhost:3000/invoices/test?payment=success',
      cancel_url: 'http://localhost:3000/invoices/test?payment=canceled',
      customer: {
        firstname: 'Test',
        lastname: '',
        email: 'test@example.com',
      }
    });

    const token = await transaction.generateToken();
    console.log("SUCCESS:", token.url);
  } catch (err) {
    console.log("ERROR:", err.message);
    if (err.response && err.response.data) {
        console.log("DETAILS:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

test();
