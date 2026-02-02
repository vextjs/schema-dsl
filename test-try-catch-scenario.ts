/**
 * 测试场景：在 try-catch 中使用 throw 方法
 * 验证 TypeScript 类型推断是否正确
 */
import { dsl } from './index';

// ===== 场景1：直接在函数中使用 throw（正常工作）=====
function scenario1_direct(id: string | null) {
  if (!id) {
    dsl.error.throw('account.notFound');
    // ✅ TypeScript 知道这里永不返回
  }
  // ✅ TypeScript 知道 id 一定不是 null
  console.log(id.toUpperCase());
}

// ===== 场景2：在 try-catch 的 catch 块中使用 throw =====
function scenario2_inCatch(id: string | null) {
  try {
    // 一些可能抛错的操作
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    // ⚠️ 在 catch 块中调用 dsl.error.throw
    dsl.error.throw('account.notFound');
    // ❌ 问题：TypeScript 可能不知道这里永不返回
  }
  // ❌ TypeScript 可能认为这里可达，报错："Not all code paths return a value"
}

// ===== 场景3：在 catch 块中使用 throw，有返回类型声明 =====
function scenario3_withReturnType(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    dsl.error.throw('account.notFound');
  }
  // ❌ TypeScript 会报错："Function lacks ending return statement"
}

// ===== 场景4：在 catch 块中先 throw，再有其他代码 =====
function scenario4_codeAfterThrow(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    dsl.error.throw('account.notFound');
    console.log('这行代码永远不会执行'); // ⚠️ 但 TypeScript 可能认为会执行
    return 'default'; // ⚠️ TypeScript 可能认为这是有效的返回
  }
}

// ===== 场景5：使用类型断言（workaround）=====
function scenario5_withAssertion(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    dsl.error.throw('account.notFound');
    return undefined as never; // 类型断言 workaround
  }
}

// ===== 场景6：多层 try-catch 嵌套 =====
function scenario6_nested(id: string | null): string {
  try {
    try {
      if (!id) {
        throw new Error('id is null');
      }
      return id.toUpperCase();
    } catch (innerError) {
      dsl.error.throw('account.notFound');
    }
  } catch (outerError) {
    return 'fallback';
  }
  // ❌ TypeScript 可能报错
}

// ===== 场景7：对比 - 使用普通 throw（正常工作）=====
function scenario7_normalThrow(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    throw new Error('account not found'); // ✅ TypeScript 知道这里永不返回
  }
  // ✅ 不会报错
}

// ===== 场景8：在 catch 中返回 never 类型的函数调用 =====
function throwHelper(): never {
  throw new Error('helper');
}

function scenario8_helperFunction(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    return throwHelper(); // ⚠️ return 一个 never 类型的函数
  }
  // ✅ 可能不报错，但这不是正确的用法
}

// ===== 场景9：严格模式 - 没有 return 语句 =====
function scenario9_strictNoReturn(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    dsl.error.throw('account.notFound');
  }
  // 在这里没有 return 语句
}

// ===== 场景10：catch 后面有额外代码块 =====
function scenario10_codeAfterCatch(id: string | null): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    dsl.error.throw('account.notFound');
  }

  // 这里有代码
  console.log('after catch');
  return 'default';
}

// ===== 场景11：条件分支中的 throw =====
function scenario11_conditionalThrow(id: string | null, shouldThrow: boolean): string {
  try {
    if (!id) {
      throw new Error('id is null');
    }
    return id.toUpperCase();
  } catch (error) {
    if (shouldThrow) {
      dsl.error.throw('account.notFound');
    }
    return 'fallback'; // 这个 return 是必需的
  }
}

// ===== 场景12：测试类型收窄 =====
function scenario12_typeNarrowing(value: string | number | null): string {
  try {
    if (value === null) {
      throw new Error('value is null');
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    return value.toUpperCase();
  } catch (error) {
    dsl.error.throw('validation.failed');
  }
}

console.log('✅ 如果编译成功，说明所有场景的类型都正确');


