export function IconSend(props) {
  return (
    <IconBase {...props}>
      <path d="M21 3L11 13" />
      <path d="M21 3l-7 18-4-8-8-4 19-6z" />
    </IconBase>
  );
}

function IconBase({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconHeart({ filled = false, ...props }) {
  return (
    <IconBase {...props} {...(filled ? { fill: 'currentColor' } : {})}>
      <path d="M12 20.5s-7-4.35-9.5-8.86C.9 8.4 2.1 5 5.4 4.2c2-.5 3.9.4 5.1 2.1a.7.7 0 0 0 1 0c1.2-1.7 3.1-2.6 5.1-2.1 3.3.8 4.5 4.2 2.9 7.44C19 16.15 12 20.5 12 20.5Z" />
    </IconBase>
  );
}

export function IconChart(props) {
  return (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 16v-4M12 16V8m5 8v-6" />
    </IconBase>
  );
}

export function IconUserCheck(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" />
      <path d="M16 12l2 2 3-3.5" />
    </IconBase>
  );
}

export function IconAlertTriangle(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconFlag(props) {
  return (
    <IconBase {...props}>
      <path d="M5 21V4" />
      <path d="M5 5h13l-3 4 3 4H5" />
    </IconBase>
  );
}

export function IconBell(props) {
  return (
    <IconBase {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
    </IconBase>
  );
}

export function IconInbox(props) {
  return (
    <IconBase {...props}>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5 4h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6l2-8z" />
    </IconBase>
  );
}

export function IconUsers(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.8 6-5.8s6 2.5 6 5.8" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M15.5 14.3c2.7.4 4.5 2.6 4.5 5.7" />
    </IconBase>
  );
}

export function IconGlobe(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
    </IconBase>
  );
}

export function IconFacebook(props) {
  return (
    <IconBase {...props}>
      <path d="M14 21v-7h2.5l.5-3H14V9c0-.9.3-1.5 1.7-1.5H17V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H8.5v3H11v7h3z" />
    </IconBase>
  );
}

export function IconInstagram(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconTikTok(props) {
  return (
    <IconBase {...props}>
      <path d="M14 3v10.8a3.3 3.3 0 1 1-3.3-3.3" />
      <path d="M14 3c.3 2.7 2.1 4.6 4.7 4.9" />
    </IconBase>
  );
}

export function IconLinkedIn(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <circle cx="8" cy="8.3" r="0.6" fill="currentColor" stroke="none" />
      <path d="M8 11v6" />
      <path d="M12 17v-3.3c0-1.3.9-2.2 2-2.2s2 .7 2 2.2V17" />
      <path d="M12 13v4" />
    </IconBase>
  );
}

export function IconWhatsapp(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 9c.3 0 .6.1.8.6l.7 1.6c.1.3 0 .5-.2.7l-.6.6c.4.9 1.4 1.9 2.3 2.3l.6-.6c.2-.2.4-.3.7-.2l1.6.7c.5.2.6.5.6.8 0 .8-.9 1.5-1.6 1.5-1.6 0-4.7-1.6-6-4.8-.3-.7-.4-1.3-.4-1.7 0-.7.4-1.2.5-1.5z" />
    </IconBase>
  );
}

export function IconStar(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
    </IconBase>
  );
}

export function IconUser(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </IconBase>
  );
}

export function IconMail(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="M4 6.5l8 6.5 8-6.5" />
    </IconBase>
  );
}

export function IconPhone(props) {
  return (
    <IconBase {...props}>
      <path d="M6.5 4.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 5 6.1a1.5 1.5 0 0 1 1.5-1.6z" />
    </IconBase>
  );
}

export function IconLock(props) {
  return (
    <IconBase {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconImage(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-5 3.5 3.5L17 11l3 3" />
    </IconBase>
  );
}

export function IconTag(props) {
  return (
    <IconBase {...props}>
      <path d="M11 3.5H5.5A2 2 0 0 0 3.5 5.5V11c0 .5.2 1 .6 1.4l8 8a2 2 0 0 0 2.8 0l5-5a2 2 0 0 0 0-2.8l-8-8a2 2 0 0 0-1.4-.6z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconPlus(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function IconCalendar(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </IconBase>
  );
}

export function IconClock(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  );
}

export function IconPercent(props) {
  return (
    <IconBase {...props}>
      <path d="M5 19L19 5" />
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </IconBase>
  );
}

export function IconFileText(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M14 3.5v4h4M8.5 12.5h7M8.5 16h7" />
    </IconBase>
  );
}

export function IconReceipt(props) {
  return (
    <IconBase {...props}>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17z" />
      <path d="M8.5 8h7M8.5 11.5h7" />
    </IconBase>
  );
}

export function IconBuilding(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3.5" width="11" height="17" rx="1" />
      <path d="M15 8.5h5v12h-5" />
      <path d="M7.5 7h1M11 7h1M7.5 10.5h1M11 10.5h1M7.5 14h1M11 14h1" />
    </IconBase>
  );
}

export function IconCheckCircle(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3l2.3 2.3 4.7-5" />
    </IconBase>
  );
}

export function IconDownload(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4v11m0 0l4-4m-4 4l-4-4" />
      <path d="M4 18.5v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </IconBase>
  );
}

export function IconTrash(props) {
  return (
    <IconBase {...props}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </IconBase>
  );
}

export function IconLogout(props) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </IconBase>
  );
}

export function IconChevronDown(props) {
  return (
    <IconBase {...props}>
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  );
}

export function IconGrip(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconMoreVertical(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconCrown(props) {
  return (
    <IconBase {...props}>
      <path d="M4 18h16l-1.5-8-4 3-2.5-5-2.5 5-4-3L4 18z" />
      <path d="M4 18h16v2H4z" />
    </IconBase>
  );
}

export function IconEdit(props) {
  return (
    <IconBase {...props}>
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z" />
      <path d="M13.5 6.5l3 3" />
    </IconBase>
  );
}

export function IconEye(props) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function IconEyeOff(props) {
  return (
    <IconBase {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3.2 4.1M6.6 6.6C4 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.3 0 2.5-.3 3.6-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </IconBase>
  );
}

export function IconPause(props) {
  return (
    <IconBase {...props}>
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </IconBase>
  );
}

export function IconPlay(props) {
  return (
    <IconBase {...props}>
      <path d="M6.5 4.5v15l13-7.5-13-7.5z" />
    </IconBase>
  );
}

export function IconSparkles(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3v4M12 17v4M4 12h4M16 12h4" />
      <path d="M7 7l1.5 1.5M15.5 15.5L17 17M17 7l-1.5 1.5M8.5 15.5L7 17" />
    </IconBase>
  );
}

export function IconConfetti(props) {
  return (
    <IconBase {...props}>
      <path d="M5 19l3-9 9 3-3 9-9-3z" />
      <path d="M14 4l.7 2M18.5 8.5l2 .7M9 4.5l-1 1.8" />
    </IconBase>
  );
}

export function IconCake(props) {
  return (
    <IconBase {...props}>
      <path d="M4 20h16v-6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6z" />
      <path d="M4 15c1 1 2 1 3 0s2-1 3 0 2 1 3 0 2-1 3 0 2 1 3 0" />
      <path d="M12 11V7M9.5 7c0-1.5 2.5-1.5 2.5-3M9.5 4c0 1.5 2.5 1.5 2.5 3" />
    </IconBase>
  );
}

export function IconShirt(props) {
  return (
    <IconBase {...props}>
      <path d="M8 4l4 2 4-2 4 3-3 3-1-1v10H8V9l-1 1-3-3 4-3z" />
    </IconBase>
  );
}

export function IconCamera(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M8 7l1.5-2.5h5L16 7" />
      <circle cx="12" cy="13" r="3.2" />
    </IconBase>
  );
}

export function IconCar(props) {
  return (
    <IconBase {...props}>
      <path d="M4.5 16v-3l2-4.5A2 2 0 0 1 8.3 7h7.4a2 2 0 0 1 1.8 1.5L19.5 13v3" />
      <path d="M4.5 16h15v2.5h-3V16m-9 2.5v-2.5" />
      <circle cx="7.5" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconMusic(props) {
  return (
    <IconBase {...props}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </IconBase>
  );
}

export function IconThumbUp(props) {
  return (
    <IconBase {...props}>
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" />
      <path d="M7 11l4-7a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 1.9 2.7l-2 6A2 2 0 0 1 16.5 20H9a2 2 0 0 1-2-2v-7z" />
    </IconBase>
  );
}

export function IconThumbDown(props) {
  return (
    <IconBase {...props}>
      <path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3z" />
      <path d="M17 13l-4 7a2 2 0 0 1-2-2v-3H5.5a2 2 0 0 1-1.9-2.7l2-6A2 2 0 0 1 7.5 4H15a2 2 0 0 1 2 2v7z" />
    </IconBase>
  );
}

export function IconArrowLeft(props) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </IconBase>
  );
}

export function IconX(props) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}

export function IconMapPin(props) {
  return (
    <IconBase {...props}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </IconBase>
  );
}

export function IconSearch(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </IconBase>
  );
}

export function IconChevronLeft(props) {
  return (
    <IconBase {...props}>
      <path d="M15 6l-6 6 6 6" />
    </IconBase>
  );
}

export function IconChevronRight(props) {
  return (
    <IconBase {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  );
}

export function IconClipboardCheck(props) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="1.5" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 12l2 2 4-4.5" />
    </IconBase>
  );
}

export function IconDoorOpen(props) {
  return (
    <IconBase {...props}>
      <path d="M13 3L6 4.3v17.4L13 21z" />
      <path d="M13 3h5v18h-5" />
      <circle cx="10" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconGauge(props) {
  return (
    <IconBase {...props}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l4-5" />
      <path d="M12 15h.01" />
    </IconBase>
  );
}

export function IconFlower(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="12" cy="6" r="2.6" />
      <circle cx="12" cy="18" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="12" r="2.6" />
      <path d="M12 20v2" />
    </IconBase>
  );
}

export function IconSuitcase(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="7" width="16" height="13" rx="1.5" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4h3c.8 0 1.5.7 1.5 1.5V7" />
      <path d="M4 12h16" />
    </IconBase>
  );
}

export function IconBaby(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 9c0 1.2.9 2 2 2s1-1 1-1M14 8.5a1.3 1.3 0 1 0 0-2.6" />
      <path d="M6 20c0-3 2.5-5 6-5s6 2 6 5" />
    </IconBase>
  );
}

export function IconGraduationCap(props) {
  return (
    <IconBase {...props}>
      <path d="M2 9.5L12 5l10 4.5-10 4.5-10-4.5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9.5V15" />
    </IconBase>
  );
}

export function IconMoon(props) {
  return (
    <IconBase {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </IconBase>
  );
}

export function IconBriefcase(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </IconBase>
  );
}

export function IconTrophy(props) {
  return (
    <IconBase {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 20h6M9.5 20c0-1.7.9-3 2.5-3s2.5 1.3 2.5 3" />
    </IconBase>
  );
}

export function IconSpeaker(props) {
  return (
    <IconBase {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <circle cx="12" cy="15" r="3.2" />
      <circle cx="12" cy="6.3" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconLightbulb(props) {
  return (
    <IconBase {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V17h5v-1.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z" />
    </IconBase>
  );
}

export function IconSnowflake(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2v20M4.5 6l15 12M19.5 6l-15 12" />
      <path d="M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2" />
    </IconBase>
  );
}

export function IconFlame(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2c1 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c1 1 1.5 2.3 1.5 3.5a4.5 4.5 0 0 1-9 0C7 9 9 6 12 2z" />
    </IconBase>
  );
}

export function IconChair(props) {
  return (
    <IconBase {...props}>
      <path d="M6 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4" />
      <path d="M6 20v-3M18 20v-3M6 13h12" />
    </IconBase>
  );
}

export function IconTable(props) {
  return (
    <IconBase {...props}>
      <path d="M3 8h18M5 8v11M19 8v11" />
      <path d="M3 8l2-4h14l2 4" />
    </IconBase>
  );
}

export function IconToilet(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3h8v6a4 4 0 0 1-8 0V3z" />
      <path d="M8 13h6c1.5 0 2 1 2 2.5C16 19 14 21 11 21s-5-2-5-5.5c0-1.5.5-2.5 2-2.5z" />
    </IconBase>
  );
}

export function IconDroplet(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" />
    </IconBase>
  );
}

export function IconLotusHands(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2.3c-1.3 2-1.3 4.3 0 6.1c1.3-1.8 1.3-4.1 0-6.1z" />
      <path d="M9.2 3.6c-1.6 1.4-2 3.6-1 5.4c1.7-.6 2.6-2.3 2.4-4.1c-.1-.5-.7-1-1.4-1.3z" />
      <path d="M14.8 3.6c1.6 1.4 2 3.6 1 5.4c-1.7-.6-2.6-2.3-2.4-4.1c.1-.5.7-1 1.4-1.3z" />
      <path d="M4 20c-.3-3 1-6 4.5-7.3" />
      <path d="M8 13.2l1.3-2.2" />
      <path d="M10.2 12l1-2.3" />
      <path d="M20 20c.3-3-1-6-4.5-7.3" />
      <path d="M16 13.2l-1.3-2.2" />
      <path d="M13.8 12l-1-2.3" />
    </IconBase>
  );
}

export function IconPerfumeBottle(props) {
  return (
    <IconBase {...props}>
      <rect x="10" y="2" width="4" height="2.2" rx="0.4" />
      <circle cx="12" cy="3.1" r="0.6" fill="currentColor" stroke="none" />
      <rect x="8.5" y="4.6" width="7" height="3.4" rx="0.6" />
      <circle cx="12" cy="15.5" r="7.2" />
      <path d="M8.3 11.3c-.5.8-.9 1.8-1 3" />
      <path d="M10.2 14.2h3.6" />
      <path d="M10.2 16.6h3.6" />
      <path d="M8.5 19.2h7" />
    </IconBase>
  );
}

export function IconWifi(props) {
  return (
    <IconBase {...props}>
      <path d="M3 8.5a15 15 0 0 1 18 0" />
      <path d="M6.2 12.5a10.5 10.5 0 0 1 11.6 0" />
      <path d="M9.5 16.3a6 6 0 0 1 5 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconUtensils(props) {
  return (
    <IconBase {...props}>
      <path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M17 2c-2 2-3 4.5-3 7.5S15 15 17 15c0-5 0-11 0-13z" />
      <path d="M17 15v7" />
    </IconBase>
  );
}

export function IconScissors(props) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.1" y2="15.9" />
      <line x1="14.5" y1="14.5" x2="20" y2="20" />
      <line x1="8.1" y1="8.1" x2="12" y2="12" />
    </IconBase>
  );
}

export function IconGift(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
    </IconBase>
  );
}

export function IconTree(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="9" r="6" />
      <line x1="12" y1="15" x2="12" y2="21" />
    </IconBase>
  );
}

export function IconUmbrella(props) {
  return (
    <IconBase {...props}>
      <path d="M22 12a10 10 0 0 0-20 0Z" />
      <path d="M12 12v8a2 2 0 0 0 4 0" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </IconBase>
  );
}

export function IconMonitor(props) {
  return (
    <IconBase {...props}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </IconBase>
  );
}

export function IconBed(props) {
  return (
    <IconBase {...props}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18h18" />
      <path d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
    </IconBase>
  );
}

export function IconBus(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="10" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <circle cx="7.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconCoins(props) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </IconBase>
  );
}

export function IconSettings(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </IconBase>
  );
}

export function IconRing(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="15" r="6.5" />
      <path d="M9 5h6l2 3.5H7L9 5z" />
      <path d="M8 6.5h8" />
    </IconBase>
  );
}

export function IconMenu(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  );
}

// --- Equipements specifiques aux lieux de mariage ---------------------------

export function IconWheelchair(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="4" r="1.6" />
      <path d="M11 7v6h5l2 5" />
      <path d="M11 10h4" />
      <path d="M8.5 11.5a5 5 0 1 0 6.9 6.2" />
    </IconBase>
  );
}

export function IconShield(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}

export function IconBolt(props) {
  return (
    <IconBase {...props}>
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
    </IconBase>
  );
}

export function IconStage(props) {
  return (
    <IconBase {...props}>
      <path d="M3 4h18" />
      <path d="M5 4c0 3 1.5 5 3 6M19 4c0 3-1.5 5-3 6" />
      <path d="M2 16h20v4H2z" />
      <path d="M12 9v4M10 13h4" />
    </IconBase>
  );
}

export function IconDiscoBall(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2v4" />
      <circle cx="12" cy="13" r="7" />
      <path d="M5 13h14M12 6c-2.5 2-2.5 12 0 14M12 6c2.5 2 2.5 12 0 14" />
    </IconBase>
  );
}

export function IconHanger(props) {
  return (
    <IconBase {...props}>
      <path d="M12 8a2 2 0 1 1 2-2" />
      <path d="M12 8v1L3 16a1 1 0 0 0 .6 1.8h16.8A1 1 0 0 0 21 16l-9-7" />
    </IconBase>
  );
}

export function IconCookingPot(props) {
  return (
    <IconBase {...props}>
      <path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6z" />
      <path d="M2 10h2M20 10h2" />
      <path d="M9 4.5c0 1 1 1 1 2s-1 1-1 2M14 4.5c0 1 1 1 1 2s-1 1-1 2" />
    </IconBase>
  );
}

export function IconElevator(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 3v18" />
      <path d="M7 10l1.5-2 1.5 2M14 14l1.5 2 1.5-2" />
    </IconBase>
  );
}

export function IconWaves(props) {
  return (
    <IconBase {...props}>
      <path d="M2 8c2 0 2-1.5 4-1.5S8 8 10 8s2-1.5 4-1.5S16 8 18 8s2-1.5 4-1.5" />
      <path d="M2 13c2 0 2-1.5 4-1.5S8 13 10 13s2-1.5 4-1.5S16 13 18 13s2-1.5 4-1.5" />
      <path d="M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5S16 18 18 18s2-1.5 4-1.5" />
    </IconBase>
  );
}

export function IconSun(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconBase>
  );
}

export function IconCity(props) {
  return (
    <IconBase {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V9l5-3v15" />
      <path d="M10 21V4h6v17" />
      <path d="M16 21v-9h3v9" />
      <path d="M12.5 8h1M12.5 11h1M12.5 14h1M7 12h1M7 15h1" />
    </IconBase>
  );
}

export function IconChandelier(props) {
  return (
    <IconBase {...props}>
      <path d="M12 2v5" />
      <path d="M4 10c0 3 3.5 4 8 4s8-1 8-4" />
      <path d="M4 10v-1M20 10v-1M12 14V9" />
      <path d="M4 7.5c.5.7.5 1.1 0 1.5-.5-.4-.5-.8 0-1.5zM20 7.5c.5.7.5 1.1 0 1.5-.5-.4-.5-.8 0-1.5zM12 7.5c.5.7.5 1.1 0 1.5-.5-.4-.5-.8 0-1.5z" />
      <path d="M9 14l-1 4M15 14l1 4M12 14v6" />
    </IconBase>
  );
}
