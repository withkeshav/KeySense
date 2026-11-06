(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function initCourse() {
    const host = document.getElementById('walletCourse');
    if (!host || typeof KEYSENSE_COURSE === 'undefined') return;
    const catalog = document.getElementById('courseCatalog');
    const lesson = document.getElementById('courseLesson');
    const search = document.getElementById('courseSearch');
    const count = document.getElementById('courseCount');
    let current = 0;
    function node(tag, text, cls) {
      const el = document.createElement(tag);
      if (text !== undefined) el.textContent = text;
      if (cls) el.className = cls;
      return el;
    }
    function button(text, fn, cls) {
      const el = node('button', text, cls || 'btn-secondary');
      el.type = 'button'; el.addEventListener('click', fn); return el;
    }
    function paragraph(parent, text, cls) { parent.appendChild(node('p', text, cls)); }
    function focusHeading(el) { el.tabIndex = -1; el.focus(); }
    function home() {
      lesson.hidden = true; catalog.hidden = false;
      document.getElementById('courseOverview').hidden = false;
      focusHeading(document.getElementById('courseTitle'));
    }
    function openPractice(practice) {
      const tab = document.querySelector('.tab[data-tab="' + practice.tab + '"]');
      if (!tab) return;
      tab.click();
      if (practice.step) document.querySelector('.learn-step[data-step="' + practice.step + '"]')?.click();
      const target = practice.anchor ? document.getElementById(practice.anchor) : document.querySelector('[data-content="' + practice.tab + '"]');
      if (target) { target.tabIndex = -1; target.focus(); target.scrollIntoView({block: 'start'}); }
    }
    function renderLesson(index) {
      current = index;
      const data = KEYSENSE_COURSE[index];
      catalog.hidden = true; document.getElementById('courseOverview').hidden = true; lesson.hidden = false;
      lesson.replaceChildren();
      lesson.appendChild(button('← All lessons', home, 'course-back'));
      paragraph(lesson, data.stage + ' / Lesson ' + (index + 1) + ' of ' + KEYSENSE_COURSE.length, 'eyebrow');
      const title = node('h2', data.title, 'lesson-title'); lesson.appendChild(title);
      paragraph(lesson, data.outcome, 'lesson-outcome');
      const concept = node('section', undefined, 'lesson-concept');
      concept.appendChild(node('h3', 'The core idea')); paragraph(concept, data.concept); lesson.appendChild(concept);
      const body = node('section', undefined, 'lesson-prose');
      body.appendChild(node('h3', 'Understand it')); data.body.forEach(text => paragraph(body, text)); lesson.appendChild(body);
      const flow = node('ol', undefined, 'concept-flow'); flow.setAttribute('aria-label', 'Concept sequence');
      data.flow.forEach((text, i) => { const item = node('li'); item.appendChild(node('span', String(i + 1).padStart(2, '0'), 'flow-number')); item.appendChild(node('span', text)); flow.appendChild(item); });
      lesson.appendChild(flow);
      const example = node('section', undefined, 'lesson-example');
      example.appendChild(node('h3', 'Work through an example')); paragraph(example, data.example); lesson.appendChild(example);
      const caution = node('aside', undefined, 'lesson-caution');
      caution.appendChild(node('strong', 'Know the limit')); paragraph(caution, data.caution); lesson.appendChild(caution);
      const deeper = node('details', undefined, 'lesson-deeper'); deeper.appendChild(node('summary', 'Go deeper')); paragraph(deeper, data.deeper); lesson.appendChild(deeper);
      const form = node('form', undefined, 'lesson-check');
      const fieldset = node('fieldset'); fieldset.appendChild(node('legend', data.question));
      data.options.forEach((text, i) => {
        const label = node('label', undefined, 'course-answer');
        const input = node('input'); input.type = 'radio'; input.name = 'course-answer'; input.value = String(i);
        label.appendChild(input); label.appendChild(node('span', text)); fieldset.appendChild(label);
      });
      form.appendChild(node('h3', 'Check your reasoning')); form.appendChild(fieldset);
      const submit = node('button', 'Check answer', 'btn-primary'); submit.type = 'submit'; form.appendChild(submit);
      const feedback = node('p', '', 'course-feedback'); feedback.setAttribute('role', 'status'); form.appendChild(feedback);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const selected = form.querySelector('input:checked');
        feedback.textContent = selected ? data.feedback[Number(selected.value)] : 'Choose an answer first.';
        feedback.dataset.correct = selected ? String(Number(selected.value) === data.answer) : '';
      });
      form.addEventListener('change', () => { feedback.textContent = ''; delete feedback.dataset.correct; });
      lesson.appendChild(form);
      if (data.caseStudy) {
        const study = data.caseStudy;
        const section = node('section', undefined, 'lesson-case');
        section.appendChild(node('h3', 'Practice case: ' + study.title));
        paragraph(section, 'Fictional case. Work on paper or explain aloud before opening the review. No real wallet is needed.', 'hint');
        paragraph(section, study.scenario);
        const tasks = node('ol');
        study.tasks.forEach(text => tasks.appendChild(node('li', text)));
        section.appendChild(tasks);
        const review = node('details', undefined, 'lesson-deeper');
        review.appendChild(node('summary', 'Review the reasoning'));
        paragraph(review, study.answer);
        review.appendChild(node('h4', 'Check your explanation'));
        const criteria = node('ul');
        study.criteria.forEach(text => criteria.appendChild(node('li', text)));
        review.appendChild(criteria);
        paragraph(review, 'An answer needs a reason and a stated limit. Opening this review does not mark the skill as mastered.', 'hint');
        section.appendChild(review);
        const variation = node('details', undefined, 'lesson-deeper');
        variation.appendChild(node('summary', 'Try a changed case'));
        paragraph(variation, study.variation);
        section.appendChild(variation);
        lesson.appendChild(section);
      }
      const transfer = node('section', undefined, 'lesson-transfer');
      transfer.appendChild(node('h3', 'Apply it without the tool')); paragraph(transfer, data.transfer);
      paragraph(transfer, 'Explain your answer aloud or on paper. Name the assumptions and the evidence you would need. A quiz answer alone is not proof of mastery.', 'hint'); lesson.appendChild(transfer);
      lesson.appendChild(button(data.practice.label + ' →', () => openPractice(data.practice), 'btn-secondary lesson-practice'));
      const references = node('section', undefined, 'lesson-sources'); references.appendChild(node('h3', 'Read the source'));
      paragraph(references, 'These links open external documentation. The lesson itself works offline.', 'hint');
      data.sources.forEach(([label, url]) => { const a = node('a', label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; references.appendChild(a); });
      lesson.appendChild(references);
      const nav = node('nav', undefined, 'lesson-navigation'); nav.setAttribute('aria-label', 'Lesson navigation');
      const previous = button('← Previous lesson', () => renderLesson(current - 1)); previous.disabled = index === 0; nav.appendChild(previous);
      nav.appendChild(button(index === KEYSENSE_COURSE.length - 1 ? 'Back to course' : 'Next lesson →', () => index === KEYSENSE_COURSE.length - 1 ? home() : renderLesson(current + 1), 'btn-primary'));
      lesson.appendChild(nav); focusHeading(title);
    }
    function renderCatalog() {
      const query = search.value.trim().toLowerCase(); catalog.replaceChildren(); let visible = 0;
      KEYSENSE_COURSE.forEach((data, i) => {
        if (!(data.title + ' ' + data.outcome + ' ' + data.stage + ' ' + data.body.join(' ') + ' ' + data.deeper + ' ' + (data.caseStudy ? Object.values(data.caseStudy).flat().join(' ') : '')).toLowerCase().includes(query)) return;
        visible++;
        const row = button('', () => renderLesson(i), 'course-row');
        row.appendChild(node('span', String(i + 1).padStart(2, '0'), 'course-number'));
        const copy = node('span', undefined, 'course-row-copy'); copy.appendChild(node('span', data.stage, 'course-stage')); copy.appendChild(node('strong', data.title)); copy.appendChild(node('span', data.outcome, 'course-outcome')); row.appendChild(copy);
        const arrow = node('span', '↗', 'course-arrow'); arrow.setAttribute('aria-hidden', 'true'); row.appendChild(arrow); catalog.appendChild(row);
      });
      count.textContent = visible + ' of ' + KEYSENSE_COURSE.length + ' lessons';
      if (!visible) paragraph(catalog, 'No matching lesson. Try “keys”, “fees”, “backup” or “signing”.', 'course-empty');
    }
    search.addEventListener('input', renderCatalog);
    document.getElementById('courseStart').addEventListener('click', () => renderLesson(0));
    renderCatalog();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCourse);
  else initCourse();
})();
