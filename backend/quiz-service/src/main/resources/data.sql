INSERT INTO quizzes (title, description, creator_id, is_public)
VALUES ('Movie Trivia', 'Test your knowledge of classic movies!', 'admin', true);

INSERT INTO questions (quiz_id, text, image_url, answers, correct_answer)
VALUES (
    1,
    'Who directed "Pulp Fiction"?',
    NULL,
    ARRAY['Quentin Tarantino', 'Martin Scorsese', 'Steven Spielberg', 'Christopher Nolan'],
    0
),
(
    1,
    'What is the name of the fictional African country in "Black Panther"?',
    'https://your-bucket.s3.amazonaws.com/wakanda.jpg',
    ARRAY['Wakanda', 'Zamunda', 'Genovia', 'Sokovia'],
    0
);