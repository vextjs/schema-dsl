import { dsl, Locale } from '../dist/index.js';
Locale.addLocale('zh-CN', {
    'account.notFound': {
        code: 40001,
        message: '账户不存在'
    }
});
try {
    dsl.error.throw('account.notFound', 'zh-CN');
}
catch (error) {
    if (error && typeof error === 'object' && 'toJSON' in error && typeof error.toJSON === 'function') {
        console.log(error.toJSON());
    }
    else {
        console.error(error);
    }
}
