interface BaiduInterface {
  getAccessToken(): Promise<string>,
  checkContent(text: string): Promise<any>,
}