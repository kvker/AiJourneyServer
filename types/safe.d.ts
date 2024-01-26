interface SafeInterface {
  checkTextDouyin(text: string): Promise<any>,
  checkImageDouyin(url: string): Promise<any>,
}