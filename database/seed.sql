-- RoadWise PH Learning App - seed data
-- Demo login: demo@kamote.ph / kamote123  (password_hash below is scrypt of 'kamote123')

SET NAMES utf8mb4;

-- Demo user
INSERT INTO users (id, full_name, email, password_hash, track) VALUES
  (1, 'Juan Dela Cruz', 'demo@kamote.ph', 'scrypt$68a84bec4f0735492b14bb09a5631055$aa8ea1786ca51fb657752fcf4648054000d4cecc9d1a6ad03955542c6773d60f3a5c08f004e72a0cdc259ee0a6104c608a16f56a74fdcc0f69f1d94d0b35aacd', 'new');

INSERT INTO notifications (user_id, kind, title, body, target, is_read) VALUES
  (1, 'streak', '6-day streak! Keep it going', 'Study one more card today to reach 7 days in a row.', 'flashcards', 0),
  (1, 'tip', 'Flashing red means stop', 'Treat a flashing red light like a stop sign: stop fully, then go when it is clear.', 'ai', 0),
  (1, 'lesson', 'New: Refresher for Licensed Drivers', '36 cards on rules and signs worth reviewing since you got your license.', 'library', 0),
  (1, 'reminder', 'Time for today''s review', 'You are 2 cards away from your daily goal.', 'set', 1);

INSERT INTO lessons (id, title, description, category, icon, order_index, duration_min, is_published) VALUES
  (1, 'Road Signs and Markings', 'Learn warning, regulatory, and informative road signs used in the Philippines.', 'Signs', 'signpost', 1, 15, 1),
  (2, 'Traffic Rules and Regulations', 'Speed limits, lane discipline, overtaking, and parking rules.', 'Rules', 'traffic', 2, 20, 1),
  (3, 'Right-of-Way', 'Who goes first at intersections, rotundas, and pedestrian crossings.', 'Rules', 'merge', 3, 12, 1),
  (4, 'Defensive Driving', 'Hazard perception, safe following distance, and anticipating other road users.', 'Safety', 'shield', 4, 18, 1),
  (5, 'Vehicle Safety and Maintenance', 'Pre-trip checks, warning lights, and basic vehicle care.', 'Vehicle', 'car', 5, 10, 1),
  (6, 'Philippine Traffic Laws (RA 4136)', 'Key provisions of the Land Transportation and Traffic Code.', 'Laws', 'gavel', 6, 25, 1);

INSERT INTO lesson_sections (lesson_id, heading, body, order_index) VALUES
  (1, 'Warning Signs', 'Warning signs are usually yellow with black symbols and warn of upcoming hazards such as curves, intersections, or pedestrian crossings.', 1),
  (1, 'Regulatory Signs', 'Regulatory signs are white with red borders and tell you what you must or must not do, for example Stop, No Entry, and Speed Limit.', 2),
  (1, 'Informative Signs', 'Informative signs are typically blue or green and provide guidance such as directions, distances, and facility locations.', 3),
  (2, 'Speed Limits', 'Unless otherwise posted, the maximum allowable speed is 60 km/h in cities and municipalities and 80 km/h on open country roads.', 1),
  (2, 'Overtaking', 'Overtake only when the road markings permit it and when you have a clear view of oncoming traffic. Never overtake on a solid line or a curve.', 2),
  (3, 'Intersections', 'At an intersection without signs or signals, yield to the vehicle that arrived first. If two arrive at the same time, yield to the one on the right.', 1),
  (3, 'Pedestrian Crossings', 'Always yield to pedestrians on a marked crossing. Slow down and be ready to stop when approaching one.', 2),
  (4, 'Safe Following Distance', 'Use the three-second rule in good conditions. Increase the gap in rain, darkness, or when following large vehicles.', 1);

INSERT INTO quizzes (id, lesson_id, title, kind, pass_score, time_limit) VALUES
  (1, 1, 'Road Signs Basics', 'lesson', 70, 300),
  (2, 2, 'Traffic Rules Basics', 'lesson', 70, 300),
  (3, NULL, 'Practice Mock Exam', 'mock_exam', 75, 900);

INSERT INTO questions (id, quiz_id, prompt, explanation, points, order_index) VALUES
  (1, 1, 'What is the main color of warning signs in the Philippines?', 'Warning signs use a yellow diamond with black symbols.', 1, 1),
  (2, 1, 'A white rectangular sign with a red border most likely means:', 'White with red border indicates a regulatory sign (must/must not do).', 1, 2),
  (3, 2, 'Unless otherwise posted, the maximum speed in cities and municipalities is:', 'The default urban limit is 60 km/h.', 1, 1),
  (4, 2, 'When may you overtake another vehicle?', 'You may overtake only when markings permit and the way is clear.', 1, 2),
  (5, 3, 'At an uncontrolled intersection, two vehicles arrive at the same time. Who yields?', 'The vehicle on the left yields to the vehicle on the right.', 1, 1),
  (6, 3, 'When approaching a marked pedestrian crossing you should:', 'Yield to pedestrians and be ready to stop.', 1, 2);

INSERT INTO options (question_id, body, is_correct, order_index) VALUES
  (1, 'Yellow', 1, 1),
  (1, 'Blue', 0, 2),
  (1, 'Green', 0, 3),
  (1, 'Brown', 0, 4),
  (2, 'You must stop immediately', 0, 1),
  (2, 'It is a regulatory sign that must be obeyed', 1, 2),
  (2, 'It is only a suggestion', 0, 3),
  (2, 'It marks a tourist spot', 0, 4),
  (3, '40 km/h', 0, 1),
  (3, '60 km/h', 1, 2),
  (3, '80 km/h', 0, 3),
  (3, '100 km/h', 0, 4),
  (4, 'Any time the road is clear', 0, 1),
  (4, 'Only when markings permit and the way is clear', 1, 2),
  (4, 'On solid lines', 0, 3),
  (4, 'On curves', 0, 4),
  (5, 'The vehicle on the right', 0, 1),
  (5, 'The vehicle on the left', 1, 2),
  (5, 'The faster vehicle', 0, 3),
  (5, 'The larger vehicle', 0, 4),
  (6, 'Speed up to pass quickly', 0, 1),
  (6, 'Yield to pedestrians and be ready to stop', 1, 2),
  (6, 'Sound your horn and continue', 0, 3),
  (6, 'Overtake the vehicle ahead', 0, 4);

INSERT INTO progress (user_id, lesson_id, status, completed_at) VALUES
  (1, 1, 'completed', NOW()),
  (1, 2, 'completed', NOW()),
  (1, 3, 'in_progress', NULL),
  (1, 4, 'not_started', NULL),
  (1, 5, 'not_started', NULL);

INSERT INTO flashcards (deck, category, icon, front, back, order_index) VALUES
  ('Road Signs', 'Signs', 'sign', 'What shape and colour are warning signs?', 'Yellow diamond with a black symbol or border, used to warn of hazards ahead.', 0),
  ('Road Signs', 'Signs', 'sign', 'What does a red octagon mean?', 'Stop completely, then proceed only when the way is clear.', 1),
  ('Road Signs', 'Signs', 'sign', 'What does a downward-pointing triangle mean?', 'Give way: slow down and yield to traffic and pedestrians.', 2),
  ('Road Signs', 'Signs', 'sign', 'What does a yellow diamond with a pedestrian symbol mean?', 'Pedestrian crossing or pedestrians ahead — slow down and be ready to stop.', 3),
  ('Road Signs', 'Signs', 'sign', 'What does a circular sign with a red border usually mean?', 'A prohibition or restriction, such as no entry or a speed limit.', 4),
  ('Road Signs', 'Signs', 'sign', 'What does a school zone sign warn?', 'Children may be crossing — reduce speed and watch for students.', 5),
  ('Road Signs', 'Signs', 'sign', 'What do blue circular signs usually show?', 'A mandatory instruction, such as turn left or keep right.', 6),
  ('Road Signs', 'Signs', 'sign', 'What does a flashing red light mean?', 'Treat it like a stop sign: stop fully, then go when safe.', 7),
  ('Road Rules', 'Rules', 'rules', 'On which side do we drive in the Philippines?', 'On the right side of the road.', 100),
  ('Road Rules', 'Rules', 'rules', 'What is the default speed limit on most city roads?', 'Around 30-40 km/h unless a sign says otherwise.', 101),
  ('Road Rules', 'Rules', 'rules', 'When must you use your headlights?', 'At night and whenever visibility is poor, such as heavy rain.', 102),
  ('Road Rules', 'Rules', 'rules', 'Who has the right of way at an intersection without signs?', 'The vehicle already on the main road or the one that arrived first.', 103),
  ('Road Rules', 'Rules', 'rules', 'Is overtaking allowed on a solid double line?', 'No. Never cross a solid double line to overtake.', 104),
  ('Road Rules', 'Rules', 'rules', 'How far should you stop from a pedestrian crossing?', 'Before the crossing line, leaving it clear for pedestrians.', 105),
  ('Road Safety', 'Safety', 'safety', 'What is the safe following distance rule?', 'The three-second rule: keep at least three seconds behind the vehicle ahead.', 200),
  ('Road Safety', 'Safety', 'safety', 'What should you do in heavy rain?', 'Slow down, increase following distance, and turn on headlights.', 201),
  ('Road Safety', 'Safety', 'safety', 'Who must wear a seatbelt?', 'Everyone in the vehicle, front and back.', 202),
  ('Road Safety', 'Safety', 'safety', 'When may you use a mobile phone while driving?', 'Only with a hands-free device, and never for texting.', 203),
  ('Road Safety', 'Safety', 'safety', 'What is the first thing to do after a minor crash?', 'Move to a safe spot, warn other traffic, and exchange details.', 204),
  ('Road Safety', 'Safety', 'safety', 'What should you do if you feel sleepy while driving?', 'Pull over safely and rest. Never push through fatigue.', 205),
  ('Vehicle Basics', 'Vehicle', 'vehicle', 'What does the oil pressure warning light mean?', 'Engine oil pressure is low — stop safely and check the oil.', 300),
  ('Vehicle Basics', 'Vehicle', 'vehicle', 'When should you check tyre pressure?', 'When tyres are cold, before long trips and at least once a month.', 301),
  ('Vehicle Basics', 'Vehicle', 'vehicle', 'What is the legal tread depth for tyres?', 'At least 1.6 mm; replace tyres worn below that.', 302),
  ('Vehicle Basics', 'Vehicle', 'vehicle', 'What should you check before a long drive?', 'Brakes, tyres, lights, oil, coolant, and fuel.', 303),
  ('Vehicle Basics', 'Vehicle', 'vehicle', 'What does a red battery warning light mean?', 'The charging system is faulty — have it checked soon.', 304),
  ('Traffic Laws', 'Laws', 'laws', 'What is the blood alcohol limit for drivers?', 'Philippine law sets a low limit; the safest choice is zero alcohol.', 400),
  ('Traffic Laws', 'Laws', 'laws', 'What documents must you carry while driving?', 'Your driver''s licence and the vehicle''s registration and insurance.', 401),
  ('Traffic Laws', 'Laws', 'laws', 'Is wearing a helmet required on motorcycles?', 'Yes. Both rider and passenger must wear an approved helmet.', 402),
  ('Traffic Laws', 'Laws', 'laws', 'What is the penalty for driving without a licence?', 'A fine and possible impounding of the vehicle.', 403),
  ('Traffic Laws', 'Laws', 'laws', 'Are children allowed on the front seat?', 'No. Children under the required height must ride in the back.', 404),
  ('Traffic Signals', 'Signals', 'signal', 'What does a steady yellow traffic light mean?', 'Prepare to stop; the light is about to turn red.', 500),
  ('Traffic Signals', 'Signals', 'signal', 'What does a green light with a left arrow mean?', 'You may turn left with care; oncoming traffic is stopped.', 501),
  ('Traffic Signals', 'Signals', 'signal', 'What does a flashing yellow light mean?', 'Proceed with caution; slow down and watch for hazards.', 502),
  ('Traffic Signals', 'Signals', 'signal', 'What does a green light mean?', 'Proceed straight or turn if the way is clear, yielding to pedestrians.', 503),
  ('Traffic Signals', 'Signals', 'signal', 'What does a police officer directing traffic override?', 'Traffic lights and road signs — always follow the officer.', 504);

INSERT INTO achievements (code, title, description, icon) VALUES
  ('first_quiz', 'First quiz taken', 'Complete your first practice quiz.', 'quiz'),
  ('first_lesson', 'First lesson done', 'Finish reading your first lesson.', 'book'),
  ('perfect_score', 'Perfect score', 'Answer every question correctly in a quiz.', 'star'),
  ('quiz_ace', 'Quiz ace', 'Pass five quizzes.', 'trophy'),
  ('flashcard_10', 'Card starter', 'Review ten flashcards.', 'cards'),
  ('seven_day_streak', 'Seven-day streak', 'Study for seven days in a row.', 'fire'),
  ('verified_driver', 'Verified driver', 'Get your driver status verified.', 'badge');
