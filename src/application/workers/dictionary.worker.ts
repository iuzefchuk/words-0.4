self.onmessage = (e: MessageEvent<{ input: unknown; type: string }>) => {
  try {
    const array = JSON.parse(e.data.input as string);
    self.postMessage({ type: 'result', value: array });
  } catch (error) {
    self.postMessage({ error: String(error), type: 'error' });
  }
};
