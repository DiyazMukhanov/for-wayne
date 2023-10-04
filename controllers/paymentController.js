const catchAsync = require('./../utils/catchAsync');
const md5 = require('md5');
const payboxMerchantId = '';
const secretKey = '';
const secretKeyOut = '';
const crypto = require('crypto');
const paymentServiceUrl = '';
const paymentOutServiceUrl = '';
const axios = require('axios');
const xml2js = require('xml2js');

const clientUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : process.env.CLIENT_URL
const serverUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.SERVER_URL

exports.testPAyment = catchAsync(async (req, res, next) => {
    // 1) Checking if already subscribed
    
    //Condition code
    if(req.user.subscriptionExpirationDate > new Date()) {

        res.status(200).json({
            message: 'Already subscribed',
            data: {
                user: req.user
            }
        })

        return;
    }
    //End condition code
  
const requestData = {
  pg_order_id: 23,
  pg_merchant_id: 552194,
  pg_amount: req.body.amount,
  pg_description: 'test',
  pg_salt: 'langy',
  pg_success_url: `${clientUrl}/payment-success`,
  pg_failure_url: `${clientUrl}/profile`
  // ... other request parameters
};

// Flatten request data
function makeFlatParamsObject(obj, parentName = '') {
    let flatParams = {};
    let i = 0;
  
    for (const key in obj) {
      i++;
      const name = parentName + key + i.toString().padStart(3, '0');
  
      if (typeof obj[key] === 'object') {
        flatParams = { ...flatParams, ...makeFlatParamsObject(obj[key], name) };
        continue;
      }
  
      flatParams[name] = obj[key].toString();
    }
  
    return flatParams;
}

const flatParams = makeFlatParamsObject(requestData);
const sortedKeys = Object.keys(flatParams).sort();

// Generate signature string
const signatureData = ['init_payment.php', ...sortedKeys.map(key => flatParams[key]), secretKey];
const signatureString = signatureData.join(';');

// Calculate MD5 hash
const signature = crypto.createHash('md5').update(signatureString).digest('hex');

// Set up POST request data
const postData = new URLSearchParams();
for (const key in requestData) {
  postData.append(key, requestData[key]);
}
postData.append('pg_sig', signature);

let xmlResponse;
// Make POST request using axios
axios.post(paymentServiceUrl, postData)
  .then(response => {
    // console.log('Response:', response.data);
    xmlResponse = response.data

    // Parse the XML response
xml2js.parseString(xmlResponse, (error, result) => {
    if (error) {
      console.error('Error parsing XML:', error);
    } else {
      // Extract data from the parsed result
      const pgStatus = result.response.pg_status[0];
      const pgPaymentId = result.response.pg_payment_id[0];
      const pgRedirectUrl = result.response.pg_redirect_url[0];
      // ... other extracted data

      res.status(200).json({
        status: pgStatus,
        paymentId: pgPaymentId,
        redirectUrl: pgRedirectUrl,
        paymentSign: signature
    });
    }
  });
  })
  .catch(error => {
    console.error('Error:', error);
  });
});

exports.paymentOut = catchAsync(async (req, res, next) => {
  console.log('started');
 // Generating a signature
const pgMerchantId = '552194';
const secretKey = secretKeyOut;
const request = {
  pg_merchant_id: pgMerchantId,
  pg_amount: 500,
  pg_order_id: "order_1234",
  pg_description: 'test',
  pg_post_link: ``,
  pg_back_link: ``,
  pg_order_time_limit: '2023-10-31 12:00:00',
  pg_salt: 'langy',
};

// Sort the request parameters alphabetically by keys
const sortedKeys = Object.keys(request).sort();
const sortedRequest = {};
for (const key of sortedKeys) {
  sortedRequest[key] = request[key];
}

// Create a string by concatenating the values of the sorted request with a semicolon
const stringToHash = Object.values(sortedRequest).join(';');

// Prepend 'reg2nonreg' and append the secret key
const stringWithSecret = 'reg2nonreg;' + stringToHash + ';' + secretKey;

// Generate the signature by taking the MD5 hash of the concatenated string
const pgSig = crypto.createHash('md5').update(stringWithSecret).digest('hex');

// Add the signature to the request object
request.pg_sig = pgSig;

// Remove 'reg2nonreg' from the request (if needed)
delete request.reg2nonreg;

// You can now use the request object for your payment request
console.log(pgSig);

// Make POST request using axios
axios.post(paymentOutServiceUrl, request)
  .then(response => {
    console.log(response);

    res.status(200).json({
      status: 'ok'
  });
  })
  .catch(error => {
    console.error('Error:', error);
  });

});

exports.postLinkResponse =  catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success'
});
});
