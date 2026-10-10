enum Lamp { red, amber, green }

enum Tone { blue, yellow, red, sky }

class Topic {
  const Topic(this.icon, this.label, this.count);
  final String icon;
  final String label;
  final String count;
}

const topics = [
  Topic('sign', 'Road signs', '48 cards'),
  Topic('rules', 'Road rules', '32 cards'),
  Topic('marking', 'Markings', '24 cards'),
  Topic('exam', 'Exam prep', '5 tests'),
];

class StudySet {
  const StudySet(this.title, this.description, this.cards, this.progress, this.icon, this.tag);
  final String title;
  final String description;
  final int cards;
  final int progress;
  final String icon;
  final String tag;
}

const studySets = [
  StudySet('Traffic Signals and Lights', 'Steady, flashing, and arrow signals', 24, 40, 'signal', 'Recent'),
  StudySet('Philippine Road Signs', 'Regulatory, warning, and guide signs', 48, 62, 'sign', ''),
  StudySet('Traffic Rules and Regulations', 'Core rules every Filipino driver should know', 32, 35, 'rules', 'Saved'),
  StudySet('Pavement Markings', 'Lines, lanes, and road surface markings', 24, 0, 'marking', 'Saved'),
  StudySet('Right-of-Way Rules', 'Intersections, crossings, and yielding', 20, 15, 'arrow', ''),
  StudySet('LTO Written Exam Practice', 'Practice questions based on key LTO topics', 60, 0, 'exam', ''),
];

class DayStat {
  const DayStat(this.day, this.date, this.parts);
  final String day;
  final String date;
  final List<int> parts;
  int get total => parts.fold(0, (sum, part) => sum + part);
}

const week = [
  DayStat('M', 'June 2, Monday', [52, 38, 30]),
  DayStat('T', 'June 3, Tuesday', [96, 74, 60]),
  DayStat('W', 'June 4, Wednesday', [80, 62, 48]),
  DayStat('T', 'June 5, Thursday', [88, 92, 83]),
  DayStat('F', 'June 6, Friday', [44, 40, 26]),
  DayStat('S', 'June 7, Saturday', [120, 92, 68]),
  DayStat('S', 'June 8, Sunday', [84, 70, 51]),
];
const goal = 150;
const chartMax = 300;

class StatTile {
  const StatTile(this.tone, this.icon, this.value, this.unit, this.label);
  final Tone tone;
  final String icon;
  final String value;
  final String unit;
  final String label;
}

const statTiles = [
  StatTile(Tone.blue, 'check', '48', 'cards', 'Mastered this month'),
  StatTile(Tone.yellow, 'flame', '6', 'days', 'Study streak'),
  StatTile(Tone.red, 'sign', '9', 'signs', 'Need another review'),
  StatTile(Tone.sky, 'clock', '87%', '', 'Scored on last quiz'),
];

enum UnitStatus { done, current, next }

class LessonUnit {
  const LessonUnit(this.title, this.meta, this.status);
  final String title;
  final String meta;
  final UnitStatus status;
}

const lessonUnits = [
  LessonUnit('Steady red, amber, and green', '6 cards · 4 min', UnitStatus.done),
  LessonUnit('Red and amber together', '4 cards · 3 min', UnitStatus.done),
  LessonUnit('Flashing signals', '5 cards · 4 min', UnitStatus.current),
  LessonUnit('Arrow and lane signals', '5 cards · 4 min', UnitStatus.next),
  LessonUnit('When enforcers override signals', '4 cards · 3 min', UnitStatus.next),
];

class Question {
  const Question({
    required this.topic,
    required this.prompt,
    required this.lit,
    this.flashing = false,
    required this.options,
    required this.correct,
    required this.explanation,
  });
  final String topic;
  final String prompt;
  final List<Lamp> lit;
  final bool flashing;
  final List<String> options;
  final int correct;
  final String explanation;
}

const questions = [
  Question(
    topic: 'Traffic signals',
    prompt: 'The red and amber lights are on at the same time. What does this mean?',
    lit: [Lamp.red, Lamp.amber],
    options: [
      'The traffic lights are broken',
      'Get ready — a green signal follows',
      'Stop and switch off your engine',
      'Proceed slowly through the junction',
    ],
    correct: 1,
    explanation:
        'Red and amber together mean you should be ready to move, but wait for green. When traffic lights are broken, none of the signals are on, or the amber signal is flashing.',
  ),
  Question(
    topic: 'Flashing signals',
    prompt: 'A traffic light is flashing amber. What should you do?',
    lit: [Lamp.amber],
    flashing: true,
    options: [
      'Stop completely and wait for green',
      'Speed up to clear the intersection',
      'Slow down and proceed with caution',
      'Ignore it — the light is off duty',
    ],
    correct: 2,
    explanation:
        'A flashing amber signal is a warning. Slow down, check for pedestrians and cross traffic, and only proceed when it is safe to do so.',
  ),
  Question(
    topic: 'Steady signals',
    prompt: 'What must a driver do at a steady red signal?',
    lit: [Lamp.red],
    options: [
      'Slow down and continue if clear',
      'Stop behind the stop line and wait',
      'Sound the horn before crossing',
      'Stop only if a pedestrian is crossing',
    ],
    correct: 1,
    explanation:
        'A steady red signal means stop. Wait behind the stop line or pedestrian lane until the signal turns green, unless a sign or traffic enforcer directs otherwise.',
  ),
];

String letter(int index) => String.fromCharCode(65 + index);

class ChatMessage {
  const ChatMessage({required this.fromUser, required this.text, this.lit, this.flashing = false});
  final bool fromUser;
  final String text;
  final List<Lamp>? lit;
  final bool flashing;
}

class TutorReply {
  const TutorReply(this.pattern, this.text, {this.lit, this.flashing = false});
  final String pattern;
  final String text;
  final List<Lamp>? lit;
  final bool flashing;
}

const tutorReplies = [
  TutorReply(
    r'quiz|practice|question',
    "Here's one for you: a traffic light is flashing amber. What should you do? Reply with your answer and I'll check it.",
    lit: [Lamp.amber],
    flashing: true,
  ),
  TutorReply(
    r'red|amber|yellow|signal|light',
    "When red and amber show together, green is about to follow. Get ready to move — release the handbrake, check your mirrors — but don't go until the light turns green and the way is clear.",
    lit: [Lamp.red, Lamp.amber],
  ),
  TutorReply(
    r'right of way|intersection|yield',
    'At an intersection without signals, slow down and look in all directions. Yield to vehicles already inside the intersection and to pedestrians crossing. Never assume the other driver will stop.',
  ),
  TutorReply(
    r'overtak|pass',
    'Only overtake when the road ahead is clear and the markings allow it. Avoid overtaking on solid lines, on curves or hills, near intersections, and at pedestrian crossings.',
  ),
];

const fallbackReply = TutorReply(
  '',
  'Good question. Start by slowing down and reading the situation: signals first, then signs and markings, then other road users. Want me to turn this into a practice question?',
);

class TutorPrompt {
  const TutorPrompt(this.label, this.tone, this.icon);
  final String label;
  final Tone tone;
  final String icon;
}

const tutorPrompts = [
  TutorPrompt('Explain red and amber together', Tone.red, 'signal'),
  TutorPrompt('Who has the right of way?', Tone.yellow, 'arrow'),
  TutorPrompt('When can I overtake?', Tone.blue, 'marking'),
  TutorPrompt('Quiz me on signals', Tone.sky, 'exam'),
];

class TopicStat {
  const TopicStat(this.label, this.tone, this.total, this.accuracy);
  final String label;
  final Tone tone;
  final int total;
  final int accuracy;
}

const topicStats = [
  TopicStat('Road signs', Tone.red, 128, 83),
  TopicStat('Traffic signals', Tone.yellow, 68, 84),
  TopicStat('Road rules', Tone.blue, 45, 74),
];