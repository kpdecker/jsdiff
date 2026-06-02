interface AncestorsLlNode {
  rawValue: { [k: string]: any } | any[];
  canonicalizedValue: any,
  next: AncestorsLlNode | null;
}

interface CanonicalizeTask {
  parent: { [k: string]: any } | any[];
  key: string | number;
  rawValue: any;
  ancestorsLl: AncestorsLlNode;
}

function duplicateAncestor(haystack: AncestorsLlNode | null, needle: any) {
  while (haystack) {
    if (haystack.rawValue === needle) {
      return haystack;
    }
    haystack = haystack.next;
  }
  return false;
}

export function canonicalize(obj: any, replacer: (k: string, v: any) => any) {
  const wrapper: any = {};
  const tasks: CanonicalizeTask[] = [
    {
      parent: wrapper,
      key: 'root',
      rawValue: obj,
      ancestorsLl: { rawValue: wrapper, next: null, canonicalizedValue: wrapper }
    }
  ];

  function doTask(task: CanonicalizeTask): any {
    let canonicalizedValue: any;

    // If we've encountered a reference cycle, bail out of it rather than
    // following it in circles forever, and skip steps 1 and 2 below.
    const dupe = duplicateAncestor(task.ancestorsLl, task.rawValue);
    if (dupe) {
      canonicalizedValue = dupe.canonicalizedValue;
    } else {
      // Step 1: run the replacer
      const replacedValue = replacer(
        task.rawValue === obj ? '' : String(task.key),
        task.rawValue
      );

      // Step 2: replace objects and arrays with new, empty ones, and queue up
      // tasks to populate those empty objects with canonicalized versions of
      // their original contents. Also sort object keys alphabetically.
      if ('[object Array]' === Object.prototype.toString.call(replacedValue)) {
        canonicalizedValue = new Array(replacedValue.length);
        for (let i = 0; i < replacedValue.length; i += 1) {
          tasks.push({
            parent: canonicalizedValue,
            key: i,
            rawValue: replacedValue[i],
            ancestorsLl: { rawValue: task.rawValue, next: task.ancestorsLl, canonicalizedValue }
          });
        }
      } else if (replacedValue && replacedValue.toJSON) {
        // Convert dates to strings - don't replace them with empty objects
        // as the subsequent clause for objects would otherwise do
        canonicalizedValue = replacedValue.toJSON();
      } else if (typeof replacedValue === 'object' && replacedValue !== null) {
        canonicalizedValue = {};
        for (const key of Object.keys(replacedValue).sort()) {
          if (Object.prototype.hasOwnProperty.call(replacedValue, key)) {
            tasks.push({
              parent: canonicalizedValue,
              key,
              rawValue: replacedValue[key],
              ancestorsLl: { rawValue: task.rawValue, next: task.ancestorsLl, canonicalizedValue }
            });
          }
        }
      } else {
        canonicalizedValue = replacedValue;
      }
    }

    // Step 3: insert the new value into the parent object
    (task.parent as any)[task.key] = canonicalizedValue;
  }

  for (let taskIndex = 0; taskIndex <= tasks.length - 1; taskIndex++) {
    doTask(tasks[taskIndex]);
  }
  return wrapper.root;
}
