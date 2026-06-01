-- Starter Pregnancy Library articles (run once in Supabase SQL Editor)
-- Safe to re-run: only inserts when the table is empty

insert into public.articles (title, summary, content, category, trimester, read_time_minutes, is_published)
select * from (values
  (
    'Foods to enjoy during pregnancy',
    'Nutritious choices that support you and your baby, based on WHO maternal nutrition guidance.',
    E'During pregnancy, aim for a balanced plate:\n\n• Iron-rich foods: lentils, beans, lean meat, dark leafy greens\n• Calcium: milk, yogurt, teff, chickpeas\n• Folic acid: leafy greens, oranges, fortified grains\n• Plenty of water throughout the day\n\nSmall, frequent meals can help with nausea in early pregnancy.\n\nAlways wash fruits and vegetables well. Avoid raw or undercooked meat and unpasteurized dairy.\n\nTalk to your midwife or doctor about supplements common in Ethiopia (iron, folic acid).',
    'nutrition',
    'all',
    4,
    true
  ),
  (
    'Safe exercise while pregnant',
    'Gentle movement most days can boost energy and mood — with your provider''s OK.',
    E'If your pregnancy is healthy, most mothers can stay active:\n\n• Walking 20–30 minutes most days\n• Prenatal stretching or yoga\n• Pelvic floor exercises\n\nStop and seek care if you have pain, bleeding, dizziness, chest pain, or contractions.\n\nAvoid contact sports, activities with fall risk, and exercising in extreme heat without hydration.\n\nEthiopian Ministry of Health guidance encourages regular, moderate activity when medically cleared.',
    'exercise',
    'all',
    3,
    true
  ),
  (
    'Managing stress and mood changes',
    'Feeling more emotional is common — support helps.',
    E'Hormone changes, sleep disruption, and life stress can affect mood during pregnancy.\n\nHelpful steps:\n• Share feelings with someone you trust\n• Rest when you can; accept help from family\n• Gentle walks and deep breathing\n• Limit isolation — community matters\n\nSeek help urgently if you have thoughts of harming yourself or feel unable to care for yourself or your baby.\n\nMama-Care pregnancy line: **8044** for urgent support.',
    'mental_health',
    'all',
    4,
    true
  ),
  (
    'Morning sickness: what is normal?',
    'Nausea in the first trimester is common — know when to call.',
    E'Many women feel nausea or vomiting in the first 12–14 weeks. Tips:\n\n• Eat small snacks (crackers, bread) before getting up\n• Sip water or ginger tea through the day\n• Avoid strong smells if they trigger nausea\n\nCall your doctor or **8044** if you cannot keep fluids down for 24 hours, feel very weak, or have dark urine (signs of dehydration).',
    'symptoms',
    'first',
    3,
    true
  ),
  (
    'Signs labor may be starting',
    'Learn early labor signs so you can plan when to go to the facility.',
    E'Possible signs labor is near:\n\n• Regular contractions that get stronger and closer\n• Lower back ache that comes in waves\n• "Show" — mucus plug with streaks of blood\n• Water breaking (fluid leaking)\n\nGo to your birth facility or call your provider if contractions are regular (about every 5 minutes for an hour), bleeding is heavy like a period, or the baby moves less than usual.\n\nHave your hospital bag and transport plan ready.',
    'labor',
    'third',
    5,
    true
  ),
  (
    'Caring for yourself after birth',
    'Recovery tips for the first weeks postpartum.',
    E'After delivery:\n\n• Rest as much as possible; sleep when the baby sleeps\n• Eat regular meals and drink water, especially if breastfeeding\n• Watch for fever, heavy bleeding, foul-smelling discharge, or severe pain — call your provider\n• Ask for help with household tasks\n\nBaby blues (mood swings) are common for a few days. If sadness lasts more than two weeks or you feel hopeless, seek mental health support.',
    'postpartum',
    'all',
    4,
    true
  ),
  (
    'Newborn feeding basics',
    'Breastfeeding support and knowing baby is getting enough.',
    E'• Aim for early skin-to-skin and feeding within the first hour when possible\n• Feed on demand — often 8–12 times per 24 hours in the first weeks\n• Watch for wet diapers (about 6+ per day after day 4) and steady weight gain\n• Get help with latch from a midwife or lactation supporter if nipples are very sore or baby is not gaining\n\nCall urgently if baby is very sleepy, not feeding, or has fewer wet diapers.',
    'newborn_care',
    'all',
    5,
    true
  ),
  (
    'Emergency warning signs — call 8044 or go to hospital',
    'Danger signs in pregnancy and after birth. Do not wait.',
    E'🚨 **Seek emergency care immediately** if you have:\n\n• Heavy vaginal bleeding (soaking a pad in an hour)\n• Severe abdominal or chest pain\n• Severe headache with vision changes or swelling of face/hands\n• Fever with chills after birth\n• Baby not moving as usual (less than 10 movements in 2 hours when you are resting)\n• Difficulty breathing\n• Seizures or fainting\n\n**Ethiopia pregnancy support line: 8044**\n\nGo to the nearest hospital if you cannot reach your provider.',
    'emergency_signs',
    'all',
    3,
    true
  )
) as v(title, summary, content, category, trimester, read_time_minutes, is_published)
where not exists (select 1 from public.articles limit 1);
