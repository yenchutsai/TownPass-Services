import { useI18n } from 'vue-i18n';

const fieldKeys: Record<string, string> = {
  位置: 'position',
  電話: 'phone',
  資料來源: 'source',
  友善項目: 'friendlyItem',
  使用提醒: 'reminder',
  設備位置: 'equipmentLocation',
  參訪提醒: 'visitReminder',
  等級: 'level',
  放置地點: 'placement',
  地點說明: 'description',
  開放時間: 'hours',
  緊急聯絡電話: 'emergencyPhone',
  設置形式: 'facilityType',
  相對位置: 'relativeLocation',
  管理單位: 'manager',
  管理單位電話: 'managerPhone',
  備註: 'note'
};

export function useMapLabels() {
  const { t, te } = useI18n({ useScope: 'global' });
  return {
    serviceLabel(id: string, fallback: string) {
      const key = `map.categories.${id}`;
      return te(key) ? t(key) : fallback;
    },
    placeName(name: string) {
      return !name || name === '未命名地點' ? t('map.unnamedPlace') : name;
    },
    infoLabel(label: string) {
      return label
        .split('－')
        .map((part) => (fieldKeys[part] ? t(`map.fields.${fieldKeys[part]}`) : part))
        .join(' · ');
    },
    infoValue(value: string) {
      return value === '穆斯林友善' ? t('map.fields.muslimFriendly') : value;
    }
  };
}
