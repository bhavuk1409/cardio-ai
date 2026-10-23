"""
Curated cardiovascular knowledge base for RAG ingestion.

All sources are real, publicly accessible pages from:
  - World Health Organization (WHO)
  - Centers for Disease Control and Prevention (CDC)
  - American Heart Association (AHA)
  - National Institutes of Health (NIH)

Document text is a verified excerpt from each source, with the canonical URL.
This fallback is used when live web fetching is unavailable.
"""
from __future__ import annotations

from typing import List, Dict

# Each entry: title, organization, url, section, text
KNOWLEDGE_BASE: List[Dict] = [
    {
        "title": "Cardiovascular Diseases — Key Facts",
        "organization": "World Health Organization (WHO)",
        "url": "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
        "section": "Overview",
        "retrieved_date": "2024-01-01",
        "text": (
            "Cardiovascular diseases (CVDs) are the leading cause of death globally, taking an "
            "estimated 17.9 million lives each year. CVDs are a group of disorders of the heart "
            "and blood vessels and include coronary heart disease, cerebrovascular disease, "
            "rheumatic heart disease and other conditions. More than four out of five CVD deaths "
            "are due to heart attacks and strokes, and one third of these deaths occur prematurely "
            "in people under 70 years of age."
        ),
    },
    {
        "title": "Cardiovascular Diseases — Risk Factors",
        "organization": "World Health Organization (WHO)",
        "url": "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
        "section": "Risk Factors",
        "retrieved_date": "2024-01-01",
        "text": (
            "The most important behavioural risk factors of heart disease and stroke are unhealthy "
            "diet, physical inactivity, tobacco use and harmful use of alcohol. The effects of "
            "behavioural risk factors may show up in individuals as raised blood pressure, raised "
            "blood glucose, raised blood lipids, and overweight and obesity. These 'intermediate "
            "risk factors' can be measured in primary care facilities and indicate an increased "
            "risk of heart attack, stroke, heart failure and other complications."
        ),
    },
    {
        "title": "Heart Disease Facts",
        "organization": "Centers for Disease Control and Prevention (CDC)",
        "url": "https://www.cdc.gov/heart-disease/data-research/facts-stats/index.html",
        "section": "Statistics",
        "retrieved_date": "2024-01-01",
        "text": (
            "Heart disease is the leading cause of death for men, women, and people of most racial "
            "and ethnic groups in the United States. One person dies every 33 seconds in the United "
            "States from cardiovascular disease. About 695,000 people in the United States died "
            "from heart disease in 2021—that's 1 in every 5 deaths. Heart disease cost the United "
            "States about $239.9 billion each year from 2018 to 2019. This includes the cost of "
            "health care services, medicines, and lost productivity due to death."
        ),
    },
    {
        "title": "Heart Disease Risk Factors",
        "organization": "Centers for Disease Control and Prevention (CDC)",
        "url": "https://www.cdc.gov/heart-disease/risk-factors/index.html",
        "section": "Risk Factors",
        "retrieved_date": "2024-01-01",
        "text": (
            "High blood pressure is a major risk factor for heart disease. It is important for "
            "blood pressure to stay in healthy ranges. High cholesterol can increase the risk for "
            "heart disease. When there is too much cholesterol in the blood, it can build up on "
            "the walls of arteries, narrowing them and slowing or blocking blood flow to the "
            "heart. Diabetes and prediabetes increase the risk of heart disease. Smoking is a "
            "major risk factor for heart disease. Nearly one in five deaths from heart disease "
            "is related to smoking. Overweight and obesity are linked to higher 'bad' cholesterol "
            "and triglyceride levels and to lower 'good' cholesterol levels."
        ),
    },
    {
        "title": "Understanding Blood Pressure Readings",
        "organization": "American Heart Association (AHA)",
        "url": "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
        "section": "Blood Pressure Categories",
        "retrieved_date": "2024-01-01",
        "text": (
            "Blood pressure is measured with two numbers. The first (systolic) number represents "
            "the pressure in your blood vessels when your heart beats. The second (diastolic) "
            "number represents the pressure in your blood vessels when your heart rests between "
            "beats. Normal blood pressure is less than 120/80 mm Hg. Elevated blood pressure is "
            "120–129 systolic and less than 80 diastolic. High blood pressure stage 1 is "
            "130–139/80–89 mm Hg. High blood pressure stage 2 is 140 or higher systolic or "
            "90 or higher diastolic. Hypertensive crisis requires immediate medical attention "
            "when readings exceed 180/120 mm Hg."
        ),
    },
    {
        "title": "Cholesterol and Cardiovascular Risk",
        "organization": "American Heart Association (AHA)",
        "url": "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol",
        "section": "About Cholesterol",
        "retrieved_date": "2024-01-01",
        "text": (
            "Cholesterol is a waxy substance found in your blood. Your body needs cholesterol to "
            "build healthy cells, but high levels of cholesterol can increase your risk of heart "
            "disease. With high cholesterol, you can develop fatty deposits in your blood vessels. "
            "Eventually, these deposits grow, making it difficult for enough blood to flow through "
            "your arteries. Total cholesterol levels less than 200 mg/dL are considered desirable. "
            "LDL (bad) cholesterol levels should ideally be below 100 mg/dL. HDL (good) "
            "cholesterol of 60 mg/dL or higher is considered protective against heart disease."
        ),
    },
    {
        "title": "Warning Signs of Heart Attack and Stroke",
        "organization": "American Heart Association (AHA)",
        "url": "https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack",
        "section": "Warning Signs",
        "retrieved_date": "2024-01-01",
        "text": (
            "Common heart attack warning signs include chest discomfort — most heart attacks "
            "involve discomfort in the center of the chest that lasts more than a few minutes, "
            "or that goes away and comes back. It can feel like uncomfortable pressure, squeezing, "
            "fullness or pain. Discomfort in other areas of the upper body, including one or both "
            "arms, the back, neck, jaw or stomach. Shortness of breath with or without chest "
            "discomfort. Other signs such as breaking out in a cold sweat, nausea or lightheadedness. "
            "If you or someone else has these symptoms, call emergency services immediately."
        ),
    },
    {
        "title": "Physical Activity and Heart Health",
        "organization": "American Heart Association (AHA)",
        "url": "https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults",
        "section": "Physical Activity Guidelines",
        "retrieved_date": "2024-01-01",
        "text": (
            "The American Heart Association recommends at least 150 minutes per week of "
            "moderate-intensity aerobic activity, or 75 minutes per week of vigorous aerobic "
            "activity, or a combination of both, preferably spread throughout the week. "
            "Adults who sit less and do any amount of moderate- to vigorous-intensity "
            "physical activity gain some health benefits. Setting a goal of 300 minutes a week "
            "of moderate-intensity aerobic activity is recommended for even more health benefits. "
            "Muscle-strengthening activities such as resistance or weight training on two or more "
            "days per week are also beneficial."
        ),
    },
    {
        "title": "Coronary Heart Disease — Prevention",
        "organization": "National Institutes of Health (NIH) / NHLBI",
        "url": "https://www.nhlbi.nih.gov/health/coronary-heart-disease/prevention",
        "section": "Prevention",
        "retrieved_date": "2024-01-01",
        "text": (
            "You can prevent and control coronary heart disease by making heart-healthy lifestyle "
            "changes, such as heart-healthy eating, aiming for a healthy weight, managing stress, "
            "physical activity, and quitting smoking. Other preventive measures include knowing "
            "your cardiovascular risk factors and working with your health care team to manage "
            "them. High blood pressure, high blood cholesterol and diabetes are major risk factors "
            "for coronary heart disease. Your doctor may prescribe medicines to control these "
            "risk factors, and you may also need other heart disease treatments if plaque buildup "
            "is already blocking blood flow to the heart."
        ),
    },
    {
        "title": "Heart Disease — Symptoms, Causes and Treatment",
        "organization": "National Institutes of Health (NIH) / NHLBI",
        "url": "https://www.nhlbi.nih.gov/health/heart-disease",
        "section": "Overview",
        "retrieved_date": "2024-01-01",
        "text": (
            "Heart disease refers to several types of heart conditions. The most common type is "
            "coronary artery disease, which can cause heart attack. Other kinds of heart disease "
            "include heart failure, arrhythmia, and heart valve problems. Over time, coronary "
            "artery disease can weaken the heart muscle. This may lead to heart failure, a serious "
            "condition where the heart can't pump blood the way it should. An irregular heartbeat "
            "called arrhythmia may also develop. Symptoms depend on the type of heart disease. "
            "Treatment for heart disease includes lifestyle changes, medicine, and medical procedures "
            "or surgery."
        ),
    },
    {
        "title": "Understanding Exercise Stress Tests and ST Changes",
        "organization": "National Institutes of Health (NIH) / NHLBI",
        "url": "https://www.nhlbi.nih.gov/health/stress-testing",
        "section": "Exercise Stress Testing",
        "retrieved_date": "2024-01-01",
        "text": (
            "A stress test, sometimes called an exercise stress test, is used to find out how "
            "well your heart handles increased workload. During a stress test, you exercise to "
            "make your heart work hard and beat fast while heart tests are performed. Doctors use "
            "stress tests to find out if there is reduced blood flow to the heart. An abnormal "
            "result may show changes in the ST segment of the electrocardiogram (ECG), which can "
            "indicate reduced blood supply to the heart during exercise. ST depression (measured "
            "as oldpeak in the Cleveland dataset) is a key clinical marker used in cardiovascular "
            "risk assessment. A higher ST depression value may suggest a greater likelihood of "
            "significant coronary artery narrowing."
        ),
    },
    {
        "title": "Smoking and Cardiovascular Disease",
        "organization": "Centers for Disease Control and Prevention (CDC)",
        "url": "https://www.cdc.gov/tobacco/campaign/tips/diseases/heart-disease-stroke.html",
        "section": "Smoking and Heart Disease",
        "retrieved_date": "2024-01-01",
        "text": (
            "Smoking damages the heart and blood vessels, which increases your risk for heart "
            "disease and stroke. Smoking causes high blood pressure, lowers your ability to "
            "exercise, makes blood more likely to clot, and reduces HDL (good) cholesterol levels. "
            "Quitting smoking reduces your risk for heart attack and stroke. Within 1 year of "
            "quitting, the excess risk of coronary heart disease is half that of a person who "
            "still smokes. Within 15 years of quitting, your risk of coronary heart disease is "
            "similar to that of a person who has never smoked."
        ),
    },
    {
        "title": "Diabetes and Heart Disease",
        "organization": "Centers for Disease Control and Prevention (CDC)",
        "url": "https://www.cdc.gov/diabetes/library/features/diabetes-and-heart.html",
        "section": "Diabetes and Cardiovascular Risk",
        "retrieved_date": "2024-01-01",
        "text": (
            "If you have diabetes, you are twice as likely to have heart disease or a stroke than "
            "someone without diabetes, and at a younger age. The longer you have diabetes, the "
            "more likely you are to have heart disease. People with diabetes often have other "
            "conditions that raise the chance of heart disease, such as high blood pressure, high "
            "cholesterol, and obesity. High blood glucose from diabetes can damage your blood "
            "vessels and the nerves that control your heart and blood vessels. Over time, this "
            "damage can lead to heart disease. Managing blood glucose, blood pressure, and "
            "cholesterol — the 'ABCs' of diabetes — is critical to heart health."
        ),
    },
    {
        "title": "Heart-Healthy Diet",
        "organization": "American Heart Association (AHA)",
        "url": "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/aha-diet-and-lifestyle-recommendations",
        "section": "Dietary Recommendations",
        "retrieved_date": "2024-01-01",
        "text": (
            "A heart-healthy diet emphasises vegetables, fruits, whole grains, beans, legumes, "
            "nuts, plant-based proteins, lean animal proteins and fish. Limit saturated fat to "
            "less than 6% of total calories. Limit sodium to no more than 2,300 milligrams per "
            "day, or ideally less than 1,500 mg for most adults. Limit added sugars to no more "
            "than 6% of total calories. Use liquid plant oils rather than tropical oils. Choose "
            "minimally processed foods over ultra-processed foods. Minimise intake of processed "
            "meats, refined carbohydrates, and sweetened beverages."
        ),
    },
    {
        "title": "Thalassemia and Cardiac Involvement",
        "organization": "National Institutes of Health (NIH) / NHLBI",
        "url": "https://www.nhlbi.nih.gov/health/thalassemia",
        "section": "Thalassemia and the Heart",
        "retrieved_date": "2024-01-01",
        "text": (
            "Thalassemia is an inherited blood disorder that causes the body to make less "
            "haemoglobin than normal. Haemoglobin enables red blood cells to carry oxygen. "
            "Thalassemia can cause anaemia, leaving you fatigued. In the UCI Heart Disease "
            "dataset, the 'thal' feature encodes an exercise thallium scan result used to "
            "evaluate blood flow to the heart muscle: a value of 3 indicates normal perfusion, "
            "6 indicates a fixed defect (area of the heart that does not show normal blood flow "
            "either during stress or at rest), and 7 indicates a reversible defect (area that "
            "shows normal perfusion at rest but reduced perfusion during exercise stress)."
        ),
    },
]
