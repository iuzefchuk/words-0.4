import { App } from 'vue';
import animateNumber from './animateNumber.ts';
import clickOutside from './clickOutside.ts';

export default {
  install(app: App) {
    app.directive('animate-number', animateNumber).directive('on-click-outside', clickOutside);
  },
};
