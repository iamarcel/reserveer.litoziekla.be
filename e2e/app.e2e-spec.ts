import { LitozieklaNg2Page } from './app.po';

describe('litoziekla-ng2 App', function() {
  let page: LitozieklaNg2Page;

  beforeEach(() => {
    page = new LitozieklaNg2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
