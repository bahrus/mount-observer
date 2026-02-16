// Test module for loading enhancementConfig from module
class ButtonEnhancement {
   constructor(element, ctx, initVals) {
      this.element = element;
      this.ctx = ctx;
      this.clicked = false;
      this.onClick = this.onClick.bind(this);
      element.addEventListener('click', this.onClick);
   }
   
   onClick(e) {
      this.clicked = true;
      console.log('Button clicked!', this.element);
   }
}

export const enhancementConfig = {
    spawn: ButtonEnhancement,
    symlinks: {},
    enhKey: 'buttonEnh'
};
