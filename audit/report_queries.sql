-- Materialized, reviewed results for the MCP report surface.
-- The underlying structural checks are executed in class4_question_bank_audit.ipynb.

-- Dataset: answer_distribution
WITH answer_distribution(answer, count, share, ideal_count, delta_from_equal, bank_rows) AS (
  VALUES
    ('A', 61, 61.0 / 456, 114, -53, 456),
    ('B', 236, 236.0 / 456, 114, 122, 456),
    ('C', 137, 137.0 / 456, 114, 23, 456),
    ('D', 22, 22.0 / 456, 114, -92, 456)
)
SELECT * FROM answer_distribution;

-- Dataset: chapter_coverage
WITH chapter_coverage(chapter, questions, required_scope, present, with_image, share) AS (
  VALUES
    ('Chapter 1', 7, 'Required', 1, 0, 7.0 / 456),
    ('Chapter 2', 68, 'Required', 1, 0, 68.0 / 456),
    ('Chapter 3', 64, 'Required', 1, 0, 64.0 / 456),
    ('Chapter 4', 0, 'Required', 0, 0, 0.0),
    ('Chapter 5 specified pages', 0, 'Required pages only', 0, 0, 0.0),
    ('Chapter 6', 85, 'Required', 1, 0, 85.0 / 456),
    ('Chapter 7', 54, 'Required', 1, 0, 54.0 / 456),
    ('Chapter 10', 61, 'Required', 1, 0, 61.0 / 456),
    ('Chapter 11', 117, 'Required', 1, 117, 117.0 / 456)
)
SELECT * FROM chapter_coverage;

-- Dataset: risk_findings
WITH risk_findings(priority, severity, area, evidence, impact, action) AS (
  VALUES
    (1, 'Critical', 'Data integrity', '54 ID values are duplicated across different rows.', 'Progress and mistakes keyed by ID can conflate unrelated questions.', 'Assign immutable unique IDs and migrate saved progress.'),
    (2, 'High', 'Official provenance', '0 of 456 explanations contain a page citation; 79 lack even a Source label.', 'Answers cannot be independently audited against a pinned official version.', 'Require document ID, version/hash, printed page, excerpt, and reviewer status.'),
    (3, 'High', 'Assessment validity', 'B is correct for 236 questions; D for 22.', 'Learners can exploit answer-position patterns instead of knowledge.', 'Balance keys globally and within every blueprint cell and exam form.'),
    (4, 'High', 'Wording cues', 'The correct choice is among the longest options on 79.4% of questions.', 'Option length becomes a strong clue.', 'Rewrite distractors to comparable specificity, grammar, and length.'),
    (5, 'High', 'Coverage', 'Chapter 4 and required Chapter 5 pages have no labeled questions.', 'A high practice score does not demonstrate official-scope coverage.', 'Set minimum item counts per official learning objective.'),
    (6, 'High', 'Source identity', '10 items cite a supplied practice PDF whose ICBC authorship is not established.', 'The bank cannot be described as official-file-only.', 'Quarantine or re-source every affected item.'),
    (7, 'High', 'Mock exam logic', 'The hard-coded form omits Chapter 1, 4, and required Chapter 5 pages.', 'The mock score is not a calibrated readiness estimate.', 'Drive forms from a versioned blueprint.'),
    (8, 'Medium', 'Learning analytics', 'Mastery is 100 minus 10 per current mistake across only four chapters.', 'The mastery percentage can mislead learners.', 'Track attempts, recency, difficulty, and objective-level mastery.'),
    (9, 'Medium', 'Skipped questions', 'Unanswered mock items are not added to the mistakes book.', 'Knowledge gaps are hidden from remediation.', 'Treat skipped items as unknown and schedule review.'),
    (10, 'Medium', 'Image item clarity', 'Question 332 asserts a right arrow while the static asset depicts both directions.', 'Image and stem can support conflicting interpretations.', 'Use a single-direction asset or a direction-neutral stem.')
)
SELECT * FROM risk_findings;

-- Dataset: code_findings
WITH code_findings(priority, severity, location, finding, consequence) AS (
  VALUES
    (1, 'Critical', 'app.js:446-460', 'Mistakes and mastery are keyed only by question.id.', 'Duplicate IDs merge progress for different questions.'),
    (2, 'High', 'app.js:351-363', 'Mock quotas are hard-coded and described as realistic.', 'The form omits official required areas.'),
    (3, 'High', 'app.js:633-637', 'Skipped questions are not logged as mistakes.', 'Remediation data understates unknown knowledge.'),
    (4, 'High', 'app.js:703-716', 'Analytics covers four chapters and uses 100 - 10 times errors.', 'Knowledge Mastery % is not a valid mastery metric.'),
    (5, 'Medium', 'index.html:62-69', 'The UI offers Classes 1, 2, and 3.', 'The bank has no Class 1/3 questions and one Class 2-tagged item.'),
    (6, 'Medium', 'index.html:90,137; app.js:656', 'Exam format claims are shown as simulation.', 'No current official source was found for that exact commercial-test format.')
)
SELECT * FROM code_findings;
