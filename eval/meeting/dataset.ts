// 10 synthetic meeting transcripts with answer keys.
//
// Each case has traps a naive extractor falls for:
// rejected ideas, finished tasks, reassignments, "maybes",
// date corrections, unassigned tasks, mixed Japanese/English.
//
// "a|b" means either alternative counts (keywords and owners).
// Deadlines are ISO dates resolved from the meeting date.
// Nov 2026: Mon 9, Tue 10, Wed 11, Thu 12, Fri 13, Mon 16, Tue 17, Wed 18, Fri 20.

export type ExpectedItem = {
  task: string;            // human-readable, for reports only
  keywords: string[];      // all should appear in the predicted task
  owner: string | null;    // null = nobody was assigned
  deadline: string | null; // YYYY-MM-DD, null = no deadline given
};

export type MeetingCase = {
  id: string;
  meetingDate: string;     // YYYY-MM-DD
  attendees: string[];     // "佐藤|Sato" = aliases of one person
  transcript: string;
  expected: ExpectedItem[];
  traps?: string;
};

export const meetings: MeetingCase[] = [
  {
    id: "01-simple",
    meetingDate: "2026-11-10",
    attendees: ["Aiko", "Ben", "Carla"],
    transcript: `
Aiko: Quick sync. The client wants the revised pricing.
Ben: I'll send them the revised pricing deck by Friday.
Carla: We still need a venue for the team offsite. I'll book one before the end of the month.
Aiko: Great. I'll review the contract tomorrow and flag anything odd.`,
    expected: [
      { task: "Send revised pricing deck", keywords: ["pricing", "deck"], owner: "Ben", deadline: "2026-11-13" },
      { task: "Book offsite venue", keywords: ["venue|book", "offsite"], owner: "Carla", deadline: "2026-11-30" },
      { task: "Review contract", keywords: ["contract"], owner: "Aiko", deadline: "2026-11-11" },
    ],
  },
  {
    id: "02-rejected-ideas",
    meetingDate: "2026-11-10",
    attendees: ["Dev", "Emma", "Farid"],
    transcript: `
Dev: Should we rebuild the login page this quarter?
Emma: No, not this quarter. Too risky before the launch.
Dev: OK, dropping it. Also I floated a customer newsletter, but nobody has time, so let's not do it.
Emma: The password reset bug is the real blocker. I'll fix it by Thursday.
Farid: I'll write the release notes once Emma's fix is in.`,
    expected: [
      { task: "Fix password reset bug", keywords: ["password", "reset"], owner: "Emma", deadline: "2026-11-12" },
      { task: "Write release notes", keywords: ["release note"], owner: "Farid", deadline: null },
    ],
    traps: "login page rebuild and newsletter were rejected",
  },
  {
    id: "03-reassigned",
    meetingDate: "2026-11-10",
    attendees: ["Grace", "Hiro", "Ines"],
    transcript: `
Grace: Hiro, can you draft the customer survey?
Hiro: I'm out all of next week, sorry. Ines, could you take it?
Ines: Sure, I'll have the survey draft done by the 20th.
Grace: Thanks. I'll share the budget spreadsheet with finance today.`,
    expected: [
      { task: "Draft customer survey", keywords: ["survey"], owner: "Ines", deadline: "2026-11-20" },
      { task: "Share budget spreadsheet with finance", keywords: ["budget|spreadsheet"], owner: "Grace", deadline: "2026-11-10" },
    ],
    traps: "survey was first asked of Hiro, then taken by Ines",
  },
  {
    id: "04-unassigned",
    meetingDate: "2026-11-12",
    attendees: ["Jun", "Kate"],
    transcript: `
Kate: The FAQ page is out of date. Someone needs to update it, but we can decide who later.
Jun: Agreed. On my side, I'll order the new laptops for the interns by next Wednesday.
Kate: And I'll call the supplier on Monday about the delayed shipment.`,
    expected: [
      { task: "Update FAQ page", keywords: ["faq"], owner: null, deadline: null },
      { task: "Order laptops for interns", keywords: ["laptop"], owner: "Jun", deadline: "2026-11-18" },
      { task: "Call supplier about shipment", keywords: ["supplier"], owner: "Kate", deadline: "2026-11-16" },
    ],
    traps: "FAQ task has no owner",
  },
  {
    id: "05-bilingual",
    meetingDate: "2026-11-11",
    attendees: ["佐藤|Sato", "鈴木|Suzuki", "Liam"],
    transcript: `
佐藤: 見積書は金曜日までにお客様に送ります。
Liam: I'll set up the staging server tomorrow.
鈴木: 今日中に議事録を共有します。
Liam: Thanks, Suzuki-san.`,
    expected: [
      { task: "Send quote to customer", keywords: ["見積|quote|estimate"], owner: "佐藤|Sato", deadline: "2026-11-13" },
      { task: "Set up staging server", keywords: ["staging"], owner: "Liam", deadline: "2026-11-12" },
      { task: "Share meeting minutes", keywords: ["議事録|minutes|notes"], owner: "鈴木|Suzuki", deadline: "2026-11-11" },
    ],
    traps: "mixed Japanese/English, Japanese names",
  },
  {
    id: "06-maybes",
    meetingDate: "2026-11-10",
    attendees: ["Maya", "Noah"],
    transcript: `
Maya: I might look at the analytics dashboard if I have spare time.
Noah: Let's not count on that one. More importantly, Acme still hasn't been invoiced.
Maya: Right, I'll send the invoice to Acme by the 15th.
Noah: I'll schedule three user interviews, all booked by Friday the 20th.`,
    expected: [
      { task: "Send invoice to Acme", keywords: ["invoice"], owner: "Maya", deadline: "2026-11-15" },
      { task: "Schedule user interviews", keywords: ["interview"], owner: "Noah", deadline: "2026-11-20" },
    ],
    traps: "analytics dashboard is a maybe, not a commitment",
  },
  {
    id: "07-date-correction",
    meetingDate: "2026-11-09",
    attendees: ["Olivia", "Pablo"],
    transcript: `
Olivia: I'll prepare the Q4 report by Wednesday. Actually, make that Thursday, I need the sales numbers first.
Pablo: Fine. The SSL certificate expires on the 14th, I'll renew it before then.
Olivia: After the report is done I'll email the board about the meeting date.`,
    expected: [
      { task: "Prepare Q4 report", keywords: ["report"], owner: "Olivia", deadline: "2026-11-12" },
      { task: "Renew SSL certificate", keywords: ["ssl|certificate"], owner: "Pablo", deadline: "2026-11-14" },
      { task: "Email the board about meeting date", keywords: ["board"], owner: "Olivia", deadline: null },
    ],
    traps: "Wednesday corrected to Thursday; board email has no date",
  },
  {
    id: "08-already-done",
    meetingDate: "2026-11-10",
    attendees: ["Quinn", "Rosa", "Sam"],
    transcript: `
Rosa: Thanks Quinn for sending the agenda yesterday, that's done.
Quinn: No problem. What's left for Friday's event?
Rosa: Catering. I'll order it by Wednesday.
Sam: And I'll print the name badges by Friday morning.`,
    expected: [
      { task: "Order catering", keywords: ["catering"], owner: "Rosa", deadline: "2026-11-11" },
      { task: "Print name badges", keywords: ["badge"], owner: "Sam", deadline: "2026-11-13" },
    ],
    traps: "agenda was already sent",
  },
  {
    id: "09-external-person",
    meetingDate: "2026-11-10",
    attendees: ["Tom", "Uma"],
    transcript: `
Tom: The client asked to see the demo again. I'll send her the demo link today.
Uma: I'll follow up with Victor from their IT team about the API keys by the end of the week.
Tom: Perfect.`,
    expected: [
      { task: "Send demo link to client", keywords: ["demo"], owner: "Tom", deadline: "2026-11-10" },
      { task: "Follow up with Victor about API keys", keywords: ["victor|api"], owner: "Uma", deadline: "2026-11-13" },
    ],
    traps: "Victor is mentioned but is not the owner",
  },
  {
    id: "10-busy",
    meetingDate: "2026-11-10",
    attendees: ["Wen", "Xavier", "Yuki", "Zara"],
    transcript: `
Wen: I'll migrate the database to the new cluster by the end of the month.
Xavier: Payment module needs tests. I'll write them by next Tuesday.
Yuki: Got the feedback on the mockups. I'll update the designs by Friday.
Zara: We talked about hiring a contractor, but we decided against it.
Zara: Instead I'll post the job listing on Thursday.`,
    expected: [
      { task: "Migrate database to new cluster", keywords: ["database|migrat"], owner: "Wen", deadline: "2026-11-30" },
      { task: "Write tests for payment module", keywords: ["test", "payment"], owner: "Xavier", deadline: "2026-11-17" },
      { task: "Update design mockups", keywords: ["mockup|design"], owner: "Yuki", deadline: "2026-11-13" },
      { task: "Post job listing", keywords: ["job|listing"], owner: "Zara", deadline: "2026-11-12" },
    ],
    traps: "contractor hire was rejected",
  },
];
