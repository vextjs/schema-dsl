module.exports = {
  visa: { pattern: /^4[0-9]{12}(?:[0-9]{3})?$/, key: 'pattern.creditCard.visa' },
  mastercard: { pattern: /^5[1-5][0-9]{14}$/, key: 'pattern.creditCard.mastercard' },
  amex: { pattern: /^3[47][0-9]{13}$/, key: 'pattern.creditCard.amex' },
  discover: { pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/, key: 'pattern.creditCard.discover' },
  jcb: { pattern: /^(?:2131|1800|35\d{3})\d{11}$/, key: 'pattern.creditCard.jcb' },
  unionpay: { pattern: /^62[0-9]{14,17}$/, key: 'pattern.creditCard.unionpay' }
};

