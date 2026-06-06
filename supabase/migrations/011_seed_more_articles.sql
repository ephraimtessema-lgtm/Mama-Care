-- Additional Pregnancy Library articles (safe to re-run — skips existing titles)

insert into public.articles (title, summary, content, category, trimester, read_time_minutes, is_published)
select * from (values
  (
    'Iron and anemia in pregnancy',
    'Why iron matters in Ethiopia and how to prevent low blood count.',
    E'Anemia (low blood) is common in pregnancy and can make you feel tired, dizzy, or short of breath.\n\nGood sources of iron:\n• Lentils, beans, chickpeas\n• Dark leafy greens (gomen)\n• Lean meat and liver (well cooked)\n• Iron-fortified cereals\n\nVitamin C (oranges, tomatoes) helps your body absorb iron. Tea/coffee with meals can reduce absorption.\n\nYour provider may prescribe iron tablets. Take them as directed — they can darken stools or cause constipation; fiber and water help.\n\nSeek care if you faint, have severe fatigue, or palpitations.',
    'nutrition',
    'all',
    4,
    true
  ),
  (
    'Sleep tips for pregnant moms',
    'Better rest when your body is working overtime.',
    E'Sleep can be harder as pregnancy progresses:\n\n• Use pillows between knees and under your belly side-lying\n• Avoid large meals right before bed\n• Limit fluids late evening if bathroom trips wake you often\n• Gentle evening walk or stretch\n• Keep room cool and dark\n\nCall **8044** or your provider if you cannot sleep because of severe pain, breathing problems, or persistent worry about your baby.',
    'mental_health',
    'all',
    3,
    true
  ),
  (
    'First trimester: what to expect',
    'Weeks 1–12 — common changes and check-ups.',
    E'The first trimester brings hormone shifts:\n\n• Breast tenderness, fatigue, mood changes\n• Nausea (often improves by week 12–14)\n• Need for more rest\n\nBook your first prenatal visit early. Discuss folic acid, tetanus vaccination schedule, HIV screening, and malaria prevention if you live in a high-risk area.\n\nAvoid alcohol, smoking, and unprescribed medicines. Tell your provider about any herbs or traditional remedies you use.',
    'symptoms',
    'first',
    5,
    true
  ),
  (
    'Second trimester: energy and movement',
    'Weeks 13–26 — often the most comfortable phase.',
    E'Many mothers feel more energy in the second trimester.\n\n• You may feel baby move (first movements often 18–22 weeks)\n• Appetite may increase — choose nutrient-dense foods\n• Stay active with walking or approved exercise\n• Dental care is safe and important\n\nWatch for: headache with vision changes, painful urination, or vaginal bleeding. Report these promptly.',
    'symptoms',
    'second',
    4,
    true
  ),
  (
    'Third trimester: preparing for birth',
    'Weeks 27–40 — planning transport, supplies, and support.',
    E'As delivery approaches:\n\n• Attend all prenatal visits; discuss birth facility and blood availability if needed\n• Pack a hospital bag: clothes, sanitary pads, baby clothes, documents\n• Plan transport — especially at night\n• Know danger signs (bleeding, severe headache, reduced baby movement)\n\nPractice breathing and comfort techniques. Identify who will support you in labor.',
    'labor',
    'third',
    5,
    true
  ),
  (
    'Breastfeeding after a cesarean',
    'Skin-to-skin and feeding are still possible after C-section.',
    E'After cesarean birth:\n\n• Ask for early skin-to-skin when medically safe\n• Support your incision with a pillow when feeding\n• Side-lying or football hold can be comfortable\n• Frequent feeding helps milk supply\n\nPain control as prescribed helps you feed comfortably. Lactation supporters can help with positioning.',
    'postpartum',
    'all',
    4,
    true
  ),
  (
    'When to call about swelling',
    'Mild swelling vs signs that need urgent care.',
    E'Mild ankle or foot swelling later in pregnancy can be normal, especially in warm weather.\n\n**Call your provider or 8044 urgently** if swelling is:\n• Sudden in face, hands, or whole body\n• With severe headache or vision changes\n• With upper belly pain\n• With shortness of breath\n\nThese can signal pre-eclampsia or other serious conditions. Do not wait.',
    'emergency_signs',
    'third',
    3,
    true
  ),
  (
    'Vaccines and pregnancy in Ethiopia',
    'Tetanus and other vaccines your provider may recommend.',
    E'Ethiopian Ministry of Health recommends tetanus toxoid vaccination during pregnancy to protect mother and newborn.\n\n• Follow the schedule your antenatal clinic gives you\n• Ask about influenza or other vaccines if you have chronic illness\n\nDo not take live vaccines without medical advice. Bring your vaccination card to every visit.',
    'nutrition',
    'all',
    3,
    true
  ),
  (
    'Partner and family support',
    'How loved ones can help during pregnancy and after birth.',
    E'Practical support matters:\n\n• Share household tasks as fatigue increases\n• Accompany prenatal visits when possible\n• Learn danger signs together\n• After birth: help with meals, baby care, and protecting mom''s rest\n\nEmotional support — listening without judgment — reduces stress. Encourage professional help if mood stays low more than two weeks.',
    'mental_health',
    'all',
    4,
    true
  ),
  (
    'Travel and long trips while pregnant',
    'Staying safe on the road between cities or villages.',
    E'For longer travel:\n\n• Carry antenatal records and emergency contacts\n• Break every 1–2 hours to walk and stretch (blood clot prevention)\n• Stay hydrated; pack snacks\n• Know facilities along your route\n\nAvoid travel after 36 weeks unless medically necessary. If you have bleeding, contractions, or high-risk pregnancy, ask your provider before traveling.',
    'symptoms',
    'all',
    3,
    true
  )
) as v(title, summary, content, category, trimester, read_time_minutes, is_published)
where not exists (
  select 1 from public.articles a where a.title = v.title
);
