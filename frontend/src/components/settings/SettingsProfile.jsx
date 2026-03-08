import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { api } from '../../lib/api';
import CountryPicker from '../CountryPicker';
import CreatorListInput from '../CreatorListInput';
import { getZodiacSign } from '../../lib/zodiac';

const BLOOD_TYPES = ['A', 'B', 'O', 'AB'];

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

function maxDaysInMonth(month) {
  if (!month) return 31;
  const m = parseInt(month);
  if ([4, 6, 9, 11].includes(m)) return 30;
  if (m === 2) return 29;
  return 31;
}

/** Normalize creator list — handle legacy string[] and new {name,url}[] */
function toCreatorList(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { name: item, url: '' } : { name: item.name || '', url: item.url || '' },
  );
}

/** Strip empty entries before saving */
function cleanCreatorList(arr) {
  return arr.filter((item) => item.name.trim()).map((item) => ({
    name: item.name.trim(),
    ...(item.url.trim() ? { url: item.url.trim() } : {}),
  }));
}

export default function SettingsProfile() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();

  // Existing fields
  const [displayName, setDisplayName] = useState('');
  const [orgType, setOrgType] = useState('indie'); // 'indie' | 'corporate' | 'club'
  const [organization, setOrganization] = useState('');
  const [bio, setBio] = useState('');
  const [countryFlags, setCountryFlags] = useState([]);

  // Profile data fields
  const [debutDate, setDebutDate] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [mbti, setMbti] = useState('');
  const [gender, setGender] = useState('');
  const [genderCustom, setGenderCustom] = useState('');
  const [representativeEmoji, setRepresentativeEmoji] = useState('');
  const [fanName, setFanName] = useState('');
  const [activityStatus, setActivityStatus] = useState('');
  const [illustrators, setIllustrators] = useState([]);
  const [riggers, setRiggers] = useState([]);
  const [modelers3d, setModelers3d] = useState([]);
  const [hashtags, setHashtags] = useState('');
  const [debutVideoUrl, setDebutVideoUrl] = useState('');

  const [saving, setSaving] = useState(false);

  // Only initialize form when user identity changes (login/logout),
  // NOT when user object reference changes (e.g. after saving SNS links).
  // This prevents unsaved form data from being wiped out.
  const initializedIdRef = useRef(null);
  useEffect(() => {
    if (!user || user.id === initializedIdRef.current) return;
    initializedIdRef.current = user.id;
    setDisplayName(user.display_name || '');
    const org = user.organization || '';
    setOrgType(user.org_type || (org ? 'corporate' : 'indie'));
    setOrganization(org);
    setBio(user.bio || '');
    setCountryFlags(user.country_flags || []);

    const pd = user.profile_data || {};
    setDebutDate(pd.debut_date || '');
    setBirthdayMonth(pd.birthday_month ? String(pd.birthday_month) : '');
    setBirthdayDay(pd.birthday_day ? String(pd.birthday_day) : '');
    setBloodType(pd.blood_type || '');
    setMbti(pd.mbti || '');
    const g = pd.gender || '';
    if (g === '男' || g === '女') {
      setGender(g);
      setGenderCustom('');
    } else if (g) {
      setGender('custom');
      setGenderCustom(g);
    } else {
      setGender('');
      setGenderCustom('');
    }
    setRepresentativeEmoji(pd.representative_emoji || '');
    setFanName(pd.fan_name || '');
    setActivityStatus(pd.activity_status || '');
    setIllustrators(toCreatorList(pd.illustrators));
    setRiggers(toCreatorList(pd.riggers));
    setModelers3d(toCreatorList(pd.modelers_3d));
    setHashtags((pd.hashtags || []).join('\n'));
    setDebutVideoUrl(pd.debut_video_url || '');
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const pd = user.profile_data || {};
    if (displayName !== (user.display_name || '')) return true;
    const currentOrgType = orgType;
    const savedOrgType = user.org_type || (user.organization ? 'corporate' : 'indie');
    if (currentOrgType !== savedOrgType) return true;
    const currentOrg = orgType === 'indie' ? '' : organization;
    if (currentOrg !== (user.organization || '')) return true;
    if (bio !== (user.bio || '')) return true;
    if (JSON.stringify(countryFlags) !== JSON.stringify(user.country_flags || [])) return true;
    if (debutDate !== (pd.debut_date || '')) return true;
    if (birthdayMonth !== (pd.birthday_month ? String(pd.birthday_month) : '')) return true;
    if (birthdayDay !== (pd.birthday_day ? String(pd.birthday_day) : '')) return true;
    if (bloodType !== (pd.blood_type || '')) return true;
    if (mbti !== (pd.mbti || '')) return true;
    const savedGender = pd.gender || '';
    const currentGender = gender === 'custom' ? genderCustom : gender;
    if (currentGender !== savedGender) return true;
    if (representativeEmoji !== (pd.representative_emoji || '')) return true;
    if (fanName !== (pd.fan_name || '')) return true;
    if (activityStatus !== (pd.activity_status || '')) return true;
    if (JSON.stringify(illustrators) !== JSON.stringify(toCreatorList(pd.illustrators))) return true;
    if (JSON.stringify(riggers) !== JSON.stringify(toCreatorList(pd.riggers))) return true;
    if (JSON.stringify(modelers3d) !== JSON.stringify(toCreatorList(pd.modelers_3d))) return true;
    if (hashtags !== (pd.hashtags || []).join('\n')) return true;
    if (debutVideoUrl !== (pd.debut_video_url || '')) return true;
    return false;
  }, [
    user, displayName, orgType, organization, bio, countryFlags,
    debutDate, birthdayMonth, birthdayDay, bloodType, mbti,
    gender, genderCustom, representativeEmoji, fanName,
    activityStatus, illustrators, riggers, modelers3d,
    hashtags, debutVideoUrl,
  ]);

  const zodiac = useMemo(
    () => getZodiacSign(birthdayMonth, birthdayDay),
    [birthdayMonth, birthdayDay],
  );

  const isDebutFuture = useMemo(() => {
    if (!debutDate) return false;
    return new Date(debutDate + 'T23:59:59') > new Date();
  }, [debutDate]);

  // Cap birthday day when month changes
  useEffect(() => {
    if (birthdayMonth && birthdayDay) {
      const max = maxDaysInMonth(birthdayMonth);
      if (parseInt(birthdayDay) > max) setBirthdayDay(String(max));
    }
  }, [birthdayMonth]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('名稱為必填欄位', { type: 'error' });
      return;
    }
    if (orgType === 'corporate' && !organization.trim()) {
      addToast('請輸入組織名稱', { type: 'error' });
      return;
    }

    // Build profile_data — only include non-empty values
    const profile_data = {};
    if (debutDate) profile_data.debut_date = debutDate;
    if (birthdayMonth && birthdayDay) {
      profile_data.birthday_month = parseInt(birthdayMonth);
      profile_data.birthday_day = parseInt(birthdayDay);
    }
    if (bloodType) profile_data.blood_type = bloodType;
    if (mbti) profile_data.mbti = mbti;
    const genderValue = gender === 'custom' ? genderCustom.trim() : gender;
    if (genderValue) profile_data.gender = genderValue;
    if (representativeEmoji.trim()) profile_data.representative_emoji = representativeEmoji.trim();
    if (fanName.trim()) profile_data.fan_name = fanName.trim();
    if (activityStatus) profile_data.activity_status = activityStatus;
    const cleanIll = cleanCreatorList(illustrators);
    const cleanRig = cleanCreatorList(riggers);
    const clean3d = cleanCreatorList(modelers3d);
    if (cleanIll.length > 0) profile_data.illustrators = cleanIll;
    if (cleanRig.length > 0) profile_data.riggers = cleanRig;
    if (clean3d.length > 0) profile_data.modelers_3d = clean3d;
    const hashtagList = hashtags.split('\n').map(s => s.trim()).filter(Boolean);
    if (hashtagList.length > 0) profile_data.hashtags = hashtagList;
    if (debutVideoUrl.trim()) profile_data.debut_video_url = debutVideoUrl.trim();

    setSaving(true);
    try {
      const updated = await api.updateMe({
        display_name: displayName.trim(),
        org_type: orgType,
        organization: orgType === 'corporate'
          ? (organization.trim() || null)
          : orgType === 'club'
            ? (organization.trim() || null)
            : null,
        bio: bio.trim() || null,
        country_flags: countryFlags,
        profile_data,
      });
      setUser(updated);
      addToast('個人資料已儲存', { type: 'success', duration: 3000 });
    } catch (err) {
      addToast(err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* === 基本欄位 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>名稱 *</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          required style={inputStyle} />
      </div>

      {/* === 選填欄位提示 === */}
      <div style={{
        padding: '10px 14px', marginBottom: '24px', borderRadius: '6px',
        background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)',
        fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5',
      }}>

        以下為選填欄位，填入的資料將顯示在側邊資訊欄中。
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>所屬組織</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={radioLabelStyle}>
            <input type="radio" name="orgType" value="indie"
              checked={orgType === 'indie'} onChange={() => setOrgType('indie')}
              style={{ accentColor: '#38bdf8' }} />
            個人勢
          </label>
          <label style={radioLabelStyle}>
            <input type="radio" name="orgType" value="corporate"
              checked={orgType === 'corporate'} onChange={() => setOrgType('corporate')}
              style={{ accentColor: '#38bdf8' }} />
            企業勢
          </label>
          <label style={radioLabelStyle}>
            <input type="radio" name="orgType" value="club"
              checked={orgType === 'club'} onChange={() => setOrgType('club')}
              style={{ accentColor: '#38bdf8' }} />
            社團勢
          </label>
        </div>
        {orgType === 'corporate' && (
          <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
            placeholder="組織名稱" style={{ ...inputStyle, marginTop: '8px' }} />
        )}
        {orgType === 'club' && (
          <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
            placeholder="社團名稱（選填）" style={{ ...inputStyle, marginTop: '8px' }} />
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>自我介紹</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
          placeholder="簡單介紹一下你的角色吧！（最多 500 字）" maxLength={500} rows={6}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }} />
        <div style={{ textAlign: 'right', fontSize: '0.8em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
          {bio.length}/500
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>顯示國旗</label>
        <CountryPicker selected={countryFlags} onChange={setCountryFlags} />
      </div>



      {/* === 初配信日期 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>初配信日期</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={debutDate} onChange={(e) => setDebutDate(e.target.value)}
            style={{ ...inputStyle, maxWidth: '220px', flex: 'none', colorScheme: 'dark' }} />
          <button type="button" onClick={() => setDebutDate('')} style={clearBtnStyle}>清空</button>
        </div>
        <div style={hintStyle}>
          如果無法確認日期，可以自由選擇或挑選頻道最早的紀錄。此欄位會影響生物樹的排序方式。如果還未出道或活動，可以填入未來日期。
        </div>
      </div>

      {/* === 生日 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>
          生日
          {zodiac && (
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>
              {zodiac.emoji} {zodiac.name}
            </span>
          )}
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={birthdayMonth} onChange={(e) => setBirthdayMonth(e.target.value)}
            style={{ ...selectStyle, minWidth: '100px' }}>
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} 月</option>
            ))}
          </select>
          <select value={birthdayDay} onChange={(e) => setBirthdayDay(e.target.value)}
            style={{ ...selectStyle, minWidth: '100px' }}>
            <option value="">日</option>
            {Array.from({ length: maxDaysInMonth(birthdayMonth) }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} 日</option>
            ))}
          </select>
          <button type="button" onClick={() => { setBirthdayMonth(''); setBirthdayDay(''); }}
            style={clearBtnStyle}>清空</button>
        </div>
      </div>

      {/* === 血型 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>血型</label>
        <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}
          style={{ ...selectStyle, minWidth: '120px' }}>
          <option value="">未設定</option>
          {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t} 型</option>)}
        </select>
      </div>

      {/* === MBTI === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>MBTI</label>
        <select value={mbti} onChange={(e) => setMbti(e.target.value)}
          style={{ ...selectStyle, minWidth: '140px' }}>
          <option value="">未設定</option>
          {MBTI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* === 性別 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>性別</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={gender} onChange={(e) => setGender(e.target.value)}
            style={{ ...selectStyle, minWidth: '120px' }}>
            <option value="">未設定</option>
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="custom">自訂</option>
          </select>
          {gender === 'custom' && (
            <input type="text" value={genderCustom} onChange={(e) => setGenderCustom(e.target.value)}
              placeholder="自由輸入…" style={{ ...inputStyle, flex: 1 }} />
          )}
        </div>
      </div>

      {/* === 代表 Emoji === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>代表 Emoji</label>
        <input type="text" value={representativeEmoji}
          onChange={(e) => setRepresentativeEmoji(e.target.value)}
          placeholder="例如：🦊" maxLength={8}
          style={{ ...inputStyle, maxWidth: '120px', fontSize: '1.2em', textAlign: 'center' }} />
      </div>

      {/* === 粉絲名稱 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>粉絲名稱</label>
        <input type="text" value={fanName} onChange={(e) => setFanName(e.target.value)}
          placeholder="例如：VTaxon民" style={inputStyle} />
      </div>

      {/* === 活動狀態 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>活動狀態</label>
        <select value={activityStatus} onChange={(e) => setActivityStatus(e.target.value)}
          style={{ ...selectStyle, minWidth: '140px' }}>
          <option value="">未設定</option>
          <option value="active">活動中</option>
          <option value="hiatus">活動休止</option>
          {(!debutDate || isDebutFuture || activityStatus === 'preparing') && (
            <option value="preparing">準備中</option>
          )}
        </select>
        {activityStatus === 'preparing' && debutDate && !isDebutFuture && (
          <div style={{ ...hintStyle, color: '#f59e0b' }}>
            初配信日期已過，儲存後活動狀態將自動切換為「活動中」。
          </div>
        )}
      </div>

      {/* === 繪師 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>繪師 Illustrator</label>
        <CreatorListInput value={illustrators} onChange={setIllustrators} />
      </div>

      {/* === 建模師 === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>建模師 Rigger</label>
        <CreatorListInput value={riggers} onChange={setRiggers} />
      </div>

      {/* === 3D === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>3D</label>
        <CreatorListInput value={modelers3d} onChange={setModelers3d} />
      </div>

      {/* === Hashtags === */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Hashtags</label>
        <textarea value={hashtags} onChange={(e) => setHashtags(e.target.value)}
          placeholder="每行一個 Hashtag"
          rows={6}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }} />
      </div>

      {/* === 初配信影片 === */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>初配信影片</label>
        <input type="url" value={debutVideoUrl} onChange={(e) => setDebutVideoUrl(e.target.value)}
          placeholder="YouTube 或 Twitch 影片網址" style={inputStyle} />
        <div style={hintStyle}>
          支援 YouTube 或 Twitch 影片連結，將嵌入顯示於側邊資訊欄中。
        </div>
      </div>

      {/* === Sticky 底部列 === */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 5,
        margin: '0 -20px', padding: '12px 20px',
        background: hasChanges
          ? 'linear-gradient(to bottom, rgba(13,21,38,0.85), rgba(13,21,38,0.98) 30%)'
          : 'linear-gradient(to bottom, rgba(13,21,38,0), rgba(13,21,38,0.98) 30%)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {hasChanges && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            color: '#f59e0b', fontSize: '0.85em', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: '1.1em' }}>●</span>
            有未儲存的變更
          </span>
        )}
        <button type="submit" disabled={saving} style={{
          padding: '10px 24px', marginLeft: hasChanges ? 'auto' : 0,
          background: hasChanges ? '#f59e0b' : '#38bdf8',
          color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          fontSize: '1em', fontWeight: 600,
          transition: 'background 0.2s',
        }}>
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </form>
  );
}

const labelStyle = {
  display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#e2e8f0',
};

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '1em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};

const selectStyle = {
  padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '1em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0', colorScheme: 'dark',
};

const radioLabelStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  color: '#e2e8f0', fontSize: '0.95em', cursor: 'pointer',
};

const hintStyle = {
  fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '4px', lineHeight: '1.4',
};

const clearBtnStyle = {
  padding: '4px 10px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85em',
  whiteSpace: 'nowrap', flexShrink: 0,
};
