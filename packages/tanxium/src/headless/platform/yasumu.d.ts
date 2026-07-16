declare global {
  var Yasumu: {
    cuid(): string;
    ui: {
      showConfirmationDialogSync(dialog: {
        title: string;
        message: string;
        yesLabel: string;
        noLabel: string;
        cancelLabel: string;
      }): boolean;
    };
  };
}

export {};
