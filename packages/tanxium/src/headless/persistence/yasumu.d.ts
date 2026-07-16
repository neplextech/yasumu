declare global {
  // The persistence adapter only needs the runtime's stable ID generator.
  var Yasumu: { cuid(): string };
}

export {};
