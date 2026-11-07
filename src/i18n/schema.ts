import common from './messages/common/zh-TW.json';
import information from './messages/information/zh-TW.json';
import map from './messages/map/zh-TW.json';
import events from './messages/events/zh-TW.json';

type MessageSchema = {
  common: typeof common;
  information: typeof information;
  map: typeof map;
  events: typeof events;
};

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
