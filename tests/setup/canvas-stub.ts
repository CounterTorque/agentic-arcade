function createContextStub(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const state: Record<PropertyKey, unknown> = { canvas };
  const noop = () => undefined;
  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'getTransform') {
        return () =>
          typeof DOMMatrix === 'function'
            ? new DOMMatrix()
            : { translateSelf() { return this; }, scaleSelf() { return this; } };
      }
      if (prop === 'measureText') return () => ({ width: 0 });
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  type: string,
) {
  if (type !== '2d') return null;
  let ctx = contexts.get(this);
  if (!ctx) {
    ctx = createContextStub(this);
    contexts.set(this, ctx);
  }
  return ctx;
} as HTMLCanvasElement['getContext'];
