module.exports = {
  cn: { pattern: /^1[3-9]\d{9}$/, min: 11, max: 11, key: 'pattern.phone.cn' },
  us: { pattern: /^\d{10}$/, min: 10, max: 10, key: 'pattern.phone.us' },
  uk: { pattern: /^(\+44\s?)?0?\d{10}$/, min: 10, max: 15, key: 'pattern.phone.uk' },
  hk: { pattern: /^[5-9]\d{7}$/, min: 8, max: 8, key: 'pattern.phone.hk' },
  tw: { pattern: /^09\d{8}$/, min: 10, max: 10, key: 'pattern.phone.tw' },
  international: { pattern: /^\+[1-9]\d{1,14}$/, min: 8, max: 15, key: 'pattern.phone.international' }
};

