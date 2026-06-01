interface AncestorsLlNode {
  val: { [k: string]: any } | any[];
  next: AncestorsLlNode | null;
}

interface CanonicalizeTask {
  parent: { [k: string]: any } | any[];
  key: string | number;
  rawValue: any;
  ancestorsLl: AncestorsLlNode;
}

function llContains(haystack: AncestorsLlNode | null, needle: any) {
  while (haystack) {
    if (haystack.val === needle) {
      return true;
    }
    haystack = haystack.next;
  }
  return false;
}

const REFERENCE_CYCLE_DETECTED = Symbol();

export function canonicalize(obj: any, replacer: (k: string, v: any) => any) {
  const wrapper: any = {};
  const tasks: CanonicalizeTask[] = [
    {
      parent: wrapper,
      key: 'root',
      rawValue: obj,
      ancestorsLl: { val: wrapper, next: null }
    }
  ];

  function doTask(task: CanonicalizeTask): any {
    if (llContains(task.ancestorsLl, task.rawValue)) {
      return REFERENCE_CYCLE_DETECTED;
    }
    const ancestorsLl = { val: task.rawValue, next: task.ancestorsLl };
    // Step 1: run the replacer
    const replacedValue = replacer(
      task.rawValue === obj ? '' : String(task.key),
      task.rawValue
    );

    // Step 2: replace objects and arrays with new, empty ones, and queue up
    // tasks to populate those empty objects with canonicalized versions of
    // their original contents. Also sort object keys alphabetically.
    let canonicalizedValue: any;
    if ('[object Array]' === Object.prototype.toString.call(replacedValue)) {
      canonicalizedValue = new Array(replacedValue.length);
      for (let i = 0; i < replacedValue.length; i += 1) {
        tasks.push({
          parent: canonicalizedValue,
          key: i,
          rawValue: replacedValue[i],
          ancestorsLl
        });
      }
    } else if (typeof replacedValue === 'object' && obj !== null) {
      canonicalizedValue = {};
      for (const key of Object.keys(replacedValue).sort()) {
        if (Object.prototype.hasOwnProperty.call(replacedValue, key)) {
          tasks.push({
            parent: canonicalizedValue,
            key,
            rawValue: replacedValue[key],
            ancestorsLl
          });
        }
      }
    } else {
      canonicalizedValue = replacedValue;
    }

    // Step 3: insert the new value into the parent object
    (task.parent as any)[task.key] = canonicalizedValue;
  }

  for (let taskIndex = 0; taskIndex <= tasks.length - 1; taskIndex++) {
    if (doTask(tasks[taskIndex]) === REFERENCE_CYCLE_DETECTED) {
      return obj;
    }
  }
  return wrapper.root;
}
