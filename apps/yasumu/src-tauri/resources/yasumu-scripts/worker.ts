self.onmessage = async (e: MessageEvent<{ filename: string }>) => {
  try {
    console.log('Worker received message:', e.data.filename);
    const file = await Deno.readTextFile(e.data.filename);
    console.log(file);
    self.close();
  } catch (error) {
    console.error('Error reading file:', error);
    self.close();
  }
};
