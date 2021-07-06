export const getIgnoredPermissions = (settings: Record<string, any>, category: string) => {
  const ignored = [];
  const attributeKey = Object.keys(settings.__permission_based__[category])[0];
  for (const key of Object.keys(settings.__permission_based__[category][attributeKey][0])) {
    if (settings.__permission_based__[category][attributeKey][0][key] === '%%%%___ignored___%%%%') {
      ignored.push(key);
    }
  }
  return ignored;
};
