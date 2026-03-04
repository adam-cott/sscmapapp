#!/usr/bin/env python3
"""
Generate deals_complete.csv and src/data/deals.json
from the 418 raw Provo Starving Student Card deals.
"""
import json, csv, re, os

SECTION_MAP = {
    1: 'pizza',
    2: 'restaurants',
    3: 'entertainment',
    4: 'retail',
    5: 'free',
    6: 'treats',
    7: 'sandwiches',
}

RAW = """SECTION 1: PIZZA (29 deals)
============================
1. Brazuca Pizza | 2-4-1! Pizza! | | | \u2460\u2461\u2462
2. Curry Pizza | Buy 1 Curry Dish Get Side & Soft drink FREE! Max $8 OFF | Lehi | | \u2461\u2462
3. Curry Pizza | FREE! 12oz Can w/ Order of Wings FREE! Max $11 OFF | Lehi | | \u2460\u2461\u2462
4. Domino's | 2-4-1! Order of Wings! Carryout Only | Saratoga & Eagle Mtn | Carryout Only | \u2460\u2461\u2462
5. Domino's | 2-4-1! Pizza! Carryout Only | Saratoga & Eagle Mtn | Carryout Only | \u2460\u2461\u2462
6. Domino's | 2-4-1! Specialty Pizza! Carryout Only | Saratoga & Eagle Mtn | Carryout Only | \u2460\u2461\u2462
7. Firebird Pizza & Pasta | 2-4-1! Pizza! Up to 2 Toppings! | | | \u2460
8. Firebird Pizza & Pasta | 50% OFF! Any Specialty Pizza! | | | \u2460
9. Firebird Pizza & Pasta | Buy Any Calzone Get One FREE! | | | \u2460
10. Firebird Pizza & Pasta | Buy Any Specialty Pizza Get One FREE! | | | \u2460
11. Gurus Cafe | Buy 1 Pizza Get 1 FREE! | Provo Center St & UVU | | \u2460
12. Malawi's Pizza | Buy Any Pizza or Salad Get One FREE! | | | \u2460
13. Marco's Pizza | 2-4-1 Pizza! | Santaquin Only | | \u2460\u2461
14. Marco's Pizza | 2-4-1 Salad! | Santaquin Only | | \u2460\u2461
15. MidiCi The Neapolitan Pizza Company | 2-4-1! Pizza! | | | \u2460\u2461\u2462
16. MidiCi The Neapolitan Pizza Company | 2-4-1! Any Gourmet Salad! | | | \u2460\u2461\u2462
17. Papa Murphy's | Buy Any Pizza Get One FREE! | Provo & Park City | | \u2460\u2461
18. Pier 49 Pizza | 2-4-1! All You Can Eat Lunch Buffet! AF only | American Fork | | \u2460\u2461
19. Pier 49 Pizza | 2-4-1! Any Pizza! AF and Provo | American Fork & Provo | | \u2460\u2461
20. Pizza Hut | 2-4-1! Med or Lrg Pizza! Carryout Only! All Wasatch Front Locations | All Wasatch Front | Carryout Only | \u2460
21. Pizza Hut | 2-4-1! Order of Cheese Sticks! Carryout Only! All Wasatch Front Locs | All Wasatch Front | Carryout Only | \u2460\u2461\u2462
22. Pizza Hut | Buy Med or Lrg Pizza Get a Melt FREE! Carryout Only! All Wasatch | All Wasatch Front | Carryout Only | \u2461\u2462
23. Pizza Pie Cafe | 2-4-1! Buffet! Highland Only | Highland | | \u2460\u2461
24. Pizza Pie Cafe | Buy 1 Buffet and 2 Drinks Get 1 Buffet FREE! All UT County | All UT County | | \u2460\u2461
25. Pizza Pie Cafe | FREE! Kid's Buffet w/ Paying Adult! Orem | Orem | | NO LIMIT
26. Ritz Eats and Sweets | 2-4-1! Pizza! Inside Classic Fun Center Orem | Orem | | \u2460
27. Rosati's Authentic Chicago Pizza | 2-4-1! Any Pizza! Dine-in & Carry Out Only | | Dine-in & Carry Out Only | \u2460\u2461\u2462
28. The Place Pizza | 2-4-1! Any Pizza! | | | \u2460
29. Zub's Pizza & Subs | Buy Any Pizza Get 1 FREE! | | | \u2460

SECTION 2: RESTAURANTS (66 deals)
==================================
30. 5 Star BBQ | Buy Any Meal Plate Get a One-Meal Plate FREE! | | | \u2460
31. 5 Star BBQ | 50% OFF! Any Meal Plate Sandwich Side or Other Reg Menu Item! | | | \u2460\u2461
32. Bajio Mexican Grill | Buy 1 Entree and 2 Drinks Get 1 Entree FREE! | | | \u2460\u2461\u2462
33. Bubbakoo's Burritos | 2-4-1! Burrito Salad Bowl Quesadilla or Other Entree! | | | \u2460\u2461
34. Buffalo Wild Wings | FREE! Kids Meal w/ Adult Entree! Orem & Lehi | Orem & Lehi | | NO LIMIT
35. Buffalo Wild Wings | FREE! Appetizer w/ Purchase $25 or More! Excl. Alcohol | Orem & Lehi | Excl. Alcohol | \u2460\u2461\u2462
36. Buffalo Wild Wings | FREE! 6 Wings w/ Purchase $15 or More! Excl. Alcohol | Orem & Lehi | Excl. Alcohol | \u2460\u2461\u2462
37. Bumblebees KBBQ & Grill | 2-4-1! Any Entree or Menu Item! All Locations | All Locations | | \u2460\u2461\u2462
38. Bumblebees KBBQ & Grill | Buy 1 K-pop Fries K-Philly K-Noodles Or Dup Pop 2 Drinks Get 1 FREE! | All Locations | | NO LIMIT
39. Carrabba's Italian Grill | Buy 2 Entrees Get a Dessert or Appetizer FREE! | | | \u2460\u2461\u2462
40. Chili's | FREE! Chips & Salsa w/ Any Entree Purchase! All Utah | All Utah | | NO LIMIT
41. Chubby's | FREE! Order of Scones w/Any Purchase! All Locations | All Locations | | NO LIMIT
42. Costa Vida | Buy 1 Entree and 2 Drinks Get 1 Entree FREE! All Utah Only | All Utah | | \u2460\u2461\u2462
43. Craving's Bistro | Buy Reg Grilled Cheese and 2 Drinks Get Reg Grilled Cheese FREE! | | | \u2460\u2461\u2462
44. Craving's Bistro | Buy Any Small Mac & Cheese Get One FREE! | | | \u2460\u2461
45. Dirty Dough's | Buy 2 Entrees & 2 Drinks Get 1 FREE! | Paul Mitchell Locs | | \u2460\u2461\u2462
46. Denny's | Kids Eat FREE! Up to 2 Kids Per Paying Adult Anytime! | Participating Locs | | NO LIMIT
47. El Beto | Buy 1 Burrito & 2 Drinks Get 1 Burrito FREE! Provo | Provo | | \u2460\u2461\u2462
48. El Beto | Buy a Combination Plate Get 1 FREE! | | | \u2460\u2461
49. El Beto | Buy 1 Entree Get 1 FREE! | | | \u2460\u2461\u2462
50. El Molcajete | Buy 1 Entree & 2 Drinks Get One FREE! | | | \u2460\u2461\u2462
51. El Pollo Loco | Buy 1 Combo Meal Get 2nd FREE! Up to $8! | Orem Lehi & Particip | | \u2460\u2461\u2462
52. Fabulosos Tacos | 2-4-1! Pastor Street Taco! | | | \u2460\u2461\u2462
53. Firebird Pizza & Pasta | 50% OFF! Any Pasta Entree! | | | \u2460
54. Five Sushi Brothers | 2-4-1! Any Sushi Roll! | | | \u2460\u2461\u2462
55. Five Sushi Brothers | 2-4-1! Any Tempura-Fried Roll! | | | \u2460\u2461\u2462
56. Ganesh Indian Cuisine | Buy 1 Dinner Entree Get 1 50% OFF! All Locs | All Locations | | \u2460\u2461\u2462
57. Golden Corral Buffet | 2-4-1! Lunch Buffet! Mon-Fri. Before 4 PM Orem | Orem | Mon-Fri Before 4 PM | \u2460\u2461
58. Golden Corral Buffet | 2-4-1! Weekend Breakfast Buffet! Orem | Orem | | \u2460\u2461
59. Gurus Cafe | Buy Any Breakfast Entree Get One FREE! | Provo Center St & UVU | | \u2460\u2461\u2462
60. Gurus Cafe | Buy Lunch or Dinner Entree & 2 Drinks Get Entree FREE! | Provo Center St & UVU | | \u2460\u2461\u2462
61. Hungry Hawaiian | 2-4-1! Entree! | | | \u2460\u2461\u2462
62. Hungry Hawaiian | 2-4-1! Guava Cake! | | | \u2460\u2461\u2462
63. Kohinoor Cuisine of India | Buy One Entree Get One 50% OFF! | | | \u2460\u2461\u2462
64. Korean Dinewan Restaurant | Buy 1 Entree & 2 Drinks Get 1 Entree FREE! | | | \u2460\u2461\u2462
65. LoLo Hawaiian BBQ | Buy 1 Plate Lunch or Mini Meal Get 1 FREE! | All Locations | | \u2460\u2461\u2462
66. LoLo Hawaiian BBQ | Buy 1 Plate Lunch or Mini Meal Get 1 50% OFF! | All Locations | | \u2460\u2461\u2462
67. Los Hermanos | Buy 1 Entree & 2 Drinks Get One Entree FREE! Up to $15 | | Up to $15 | \u2460\u2461
68. Nautical Bowls | 2-4-1! Any Acai Bowl or Any Other Bowl! | | | \u2460\u2461\u2462
69. Ombu Grill | Buy 1 Menu Item and 2 Drinks Get 1 Menu Item FREE! Excl. Buffet | | Excl. Buffet | \u2460\u2461
70. Outback Steakhouse | Buy Any Entree Get a Bloomin' Onion FREE! Orem | Orem | | \u2460\u2461
71. Rancherito's | Buy a Combo Meal Get a Combo Meal 50% OFF! | | | \u2460\u2461
72. Rancherito's | Buy 1 Burrito Get a Bean and Cheese Burrito FREE! PG Only | Pleasant Grove Only | | \u2460\u2461\u2462
73. Red Fuego | Buy 1 Entree Get 1 Entree FREE! All Locations | All Locations | | \u2460
74. Rodizio Grill | Buy Any Entree Get Any Specialty Beverage & Any Dessert | | | \u2460\u2461\u2462
75. Rodizio Grill | Buy 1 Entree Get 1 Dessert FREE! (Up to 2 People) Excludes Holidays | | Up to 2 People Excludes Holidays | \u2460\u2461\u2462
76. Ruby River | Buy 1 Entree Get an Appetizer FREE! Up to $8 | | Up to $8 | \u2460\u2461\u2462
77. Rumbi Island Grill | 2-4-1! Any Rice Bowl! All UT Locations | All UT | | \u2460\u2461\u2462
78. Slurp | Buy 8 pc Chicken Wing Get a Boba Drink FREE! | | | \u2460
79. Sweeto Burrito | Buy 1 Break Neck Breakfast Burrito Get 1 FREE! | | | \u2460
80. Sweeto Burrito | Buy 1 Burrito or Los 3 Amigos Tacos & 2 Drinks Get 1 FREE! | | | \u2460\u2461
81. Sweeto Burrito | Buy 1 Regular Burrito Get 1 FREE! | | | \u2460
82. Taco Time | 2-4-1! Any Single Menu Item! Orem | Orem | | \u2460\u2461\u2462
83. Tandoor Indian Grill | 2-4-1! Entree! | | | \u2460
84. The Great Greek Mediterranean Grill | Buy 1 Reg Gyro Get 1 FREE! | | | \u2460
85. The Smoked Taco | Buy 1 Taco Get 1 FREE! All Locations | All Locations | | \u2460
86. Umami Japanese Barbeque | Buy 1 Lunch Buffet Get 1 FREE! | | | \u2460
87. Umami Japanese Barbeque | Buy 1 Lunch Buffet Get 1 50% OFF! | | | \u2460\u2461\u2462
88. Village Inn | 2-4-1! Entree! Provo | Provo | | \u2460\u2461\u2462
89. Village Inn | Buy an Entree Get a Slice of Pie FREE! Provo | Provo | | \u2460\u2461\u2462
90. Wallaby's | Buy Any Platter & 2 Drinks Get Any Platter FREE! Up to $14 | | Up to $14 | \u2460\u2461\u2462
91. Wing Nutz | 2-4-1! Entree! Max Discount $15! | Orem & SF | Max Discount $15 | \u2460\u2461
92. Wingers | Buy 1 Entree & 2 Drinks Get 1 Entree FREE! Up to $10 | | Up to $10 | \u2460\u2461\u2462
93. Wingers | FREE! Dessert With Any Entree Purchase! Provo | Provo | | \u2460\u2461\u2462
94. Wingstop | 2-4-1! 6 Piece Combo Meal! All Northern UT locations | All Northern UT | | \u2460\u2461
95. Yummy's Korean BBQ | Buy 1 Entree and 2 Sodas Get 1 FREE! Up to $11 | | Up to $11 | \u2460

SECTION 3: ENTERTAINMENT (65 deals)
====================================
96. Back Nine Golf | Buy 1 Hour Get 1 FREE! Code: SSCARD Bring Clubs | All UT | Code: SSCARD Bring Clubs | \u2460\u2461\u2462
97. BYU Bowling & Games Center | 2-4-1! Game of Bowling! M-Fri Before 6pm | | M-Fri Before 6pm | \u2460\u2461
98. BYU Outdoors Unlimited | 2-4-1! Downhill Ski Snowboard or CC Ski Rental! M-Th | | M-Th | \u2460\u2461\u2462
99. BYU Outdoors Unlimited | 2-4-1! One Hour Tandem Bike Rental! | | | \u2460\u2461\u2462
100. CLAS Ropes Course | 2-4-1! Admission Christmas & Halloween Cruise! Valid M-Th 8pm | | M-Th 8pm Ride | \u2460\u2461
101. CLAS Ropes Course | 2-4-1! Canoe Rental or Zipline Tour! Reservation Required | | Reservation Required | \u2460\u2461
102. Classic Fun Center | 2-4-1! Skating Climbing Bouncing or Laser Tag! Orem | Orem | | \u2460\u2461\u2462
103. Coin Crazy | 50% OFF! 1 Hr of Bowling! M-Th Before 6 PM | | M-Th Before 6 PM | \u2460\u2461\u2462
104. Coin Crazy | Buy a 2 hr Play Pass Get a 2 hr Play Pass FREE! | | | \u2460\u2461
105. Color Me Mine | 2-4-1! Studio Fee! M-Th | | M-Th | NO LIMIT
106. Dragon's Keep | Buy 1 Board Game Get 1 50% OFF! All Locations | All Locations | | \u2460
107. Dragon's Keep | Buy 1 Graphic Novel Get 1 50% OFF! All Locations | All Locations | | \u2460
108. Dreamwalk Park | Buy 1 Adult Ticket Get a Child Ticket FREE! | | | \u2460\u2461\u2462
109. Dreamwalk Park | Buy 1 Adult Ticket Get an Adult or Child Ticket 50% OFF! | | | \u2460\u2461\u2462
110. DryBarComedy.com | 2-4-1! Comedy Show Admission! Use Code DBSSC | | Use Code DBSSC | \u2460
111. Escapes In Time | 50% OFF! Any Group Admission for One Room! Use Code SSC | | Use Code SSC | \u2460
112. FatCats | 2-4-1! Arcade Card! Up to $25 | | Up to $25 | \u2460\u2461\u2462
113. FatCats | 50% OFF! 1 Hr Pool Table! Provo | Provo | | \u2460\u2461\u2462
114. FatCats | 50% OFF! Bowling! Before 8 PM Provo | Provo | Before 8 PM | \u2460\u2461\u2462
115. Game Grid | $25 OFF! Any Purchase of $50 or More! Lehi | Lehi | | \u2460\u2461\u2462
116. Game Grid | 50% OFF! Any Magic Tournament Entry! Lehi | Lehi | | \u2460
117. GetOut Games | 50% OFF! Group Admission for One Room! M-Th | | M-Th | \u2460
118. Hang Time Adventure Park | $6 OFF! Any Adventure Park Pass! College ID M-Th or Fri-Sat after 9PM | | College Student ID M-Th anytime or Fri-Sat after 9 PM | NO LIMIT
119. Hang Time Adventure Park | 2-4-1! Hour for Same Person! M-Th | | M-Th | NO LIMIT
120. Heber Hatchets | 2-4-1! Axe Throwing! Up to 4 Throwers. M-Th | | M-Th Up to 4 Throwers | \u2460\u2461
121. HiddenHunts.com | 30% OFF! Treasure Hunt Adventure! Code: SSC | | Code: SSC | NO LIMIT
122. High Country Adventure | 2-4-1! River Tubing! Valid M-F Code SSC | Provo Canyon | M-F Code SSC | \u2460
123. Improv Broadway | Buy 1 Admission Get 1 FREE! | | | \u2460\u2461\u2462
124. Jack & Jill Lanes | 2-4-1! Bowling for Same Player! M-Th Before 6pm Not Valid Holidays | Lehi & AF | M-Th Before 6pm Not Valid Holidays Shoes Not Included | \u2460\u2461\u2462
125. Jack & Jill Lanes | 2-4-1! Game of Laser Tag for Same Player! M-Th before 6pm | Lehi | M-Th before 6pm Not Valid Holidays | \u2460\u2461\u2462
126. Karaoke38 | 2-4-1! Hour of Karaoke! | | | \u2460
127. Karaoke38 | 2-4-1! Hour of Karaoke! M-Th Max 8 People Per Use | | M-Th Max 8 People Per Use | NO LIMIT
128. Kreative Kiln | Buy One Play in the Clay Session Get One FREE! | | | \u2460
129. LAN King | 2-4-1! Hour of Game Time! Up to 4 Players | | Up to 4 Players | \u2460\u2461\u2462
130. LAN King | 25% OFF! Unlimited 30-Day Pass! | | | \u2460\u2461\u2462
131. LAN King | 50% OFF! Private Party for Up to 10-Players! | | | \u2460
132. Laser Assault | 2-4-1! Laser Assault Game! | | | \u2460\u2461\u2462
133. Laser Assault | 50% OFF! Friday Night Fire Fight Pass! | | | \u2460\u2461
134. Lowes Xtreme Air Sports | 2-4-1! Admission! | | | \u2460\u2461\u2462
135. Miracle Bowl | 2-4-1! Game! Up to 3 free games per visit! Not Valid after 5 PM Sat | Orem | Not Valid after 5 PM Sat Holidays or School Holidays | NO LIMIT
136. Ninja Playground | 2-4-1! Admission to Open Gym! | | | \u2460\u2461
137. Peaks Ice Arena | 2-4-1! Reg Admission! Skate Rental Not Included | | Skate Rental Not Included | \u2460\u2461
138. Provo Beach | 2-4-1! Attraction! Excludes Flowrider | | Excludes Flowrider | \u2460
139. Provo Canyon Adventures | 2-4-1! Zipline Tour! Appt. Req. Please Tip | Provo Canyon | Appt Required Please Tip | \u2460
140. Quarry Indoor Climbing Center | 2-4-1! Day Pass! Not Valid Mon or Sat After 6pm | | Not Valid Mon or Sat After 6pm Shoes and Harness Not Included | \u2460\u2461\u2462
141. Quick Wits Comedy | Buy 1 Admission Get 1 FREE! | | | \u2460\u2461\u2462
142. Redline Racing | 2-4-1! Race! Includes free helmet & headsock | | | \u2460\u2461
143. Rhyno's Axe & Archery | 2-4-1! Axe Throwing or Archery! Valid M-Th | | Valid M-Th | NO LIMIT
144. Rowley's Red Barn | 2-4-1! Admission to Corn Maze and Fall Festival! M-Th | Santaquin | M-Th | \u2460\u2461\u2462
145. Salsa at Southworth | 2-4-1! Thurs Admission! | | | \u2460\u2461\u2462
146. SCERA | 2-4-1! Same Day Musical Tickets! Present Card in Person | Orem | Present Card in Person | \u2460\u2461\u2462
147. Scratch Miniature Golf | 2-4-1! Round of Mini Golf! | | | \u2460\u2461
148. Stadium Cinemas | 2-4-1! Movie Ticket! | | | \u2460\u2461\u2462
149. The Hive Trampoline Park | 2-4-1! First Month Any Membership! | | | \u2460\u2461
150. The Pickr | 2-4-1! 3 Hr Open Play Session! | Lehi & Bluffdale | | \u2460\u2461\u2462
151. The Rift Augmented Reality | 2-4-1! Any Experience! Max 8 People | | Max 8 People | \u2460\u2461\u2462
152. The Ruth | 50% OFF! Same Day Ticket! Present Card in Person | | Present Card in Person | \u2460\u2461
153. This Is The Place Heritage Park | 2-4-1! Admission! | | | \u2460\u2461
154. Us and Art | 2-4-1! Themed Paint Night Experience! | | | \u2460\u2461
155. Utah Center for the Ceramic Arts | 50% OFF! One Class! Code: SSC | | Code: SSC | \u2460\u2461
156. Utah Country Dance | 2-4-1! Wednesday Admission! | | | \u2460\u2461\u2462
157. Utah Grizzlies | 2-4-1! Ticket! Regular Season Only | | Regular Season Only | \u2460\u2461\u2462
158. Voltage eBike | Rent 1 eBike for 1 Hr Get 2nd eBike FREE! M-Th | | M-Th | \u2460
159. Zipline Utah | 2-4-1! Screaming Falcon Big Line! Code: SSC242U | Provo Canyon | Code: SSC242U | \u2460\u2461
160. Zipline Utah | 2-4-1! Screaming Falcon Rush! Code: SSC242U | Provo Canyon | Code: SSC242U | \u2460\u2461

SECTION 4: RETAIL, AUTO & MORE (38 deals)
==========================================
161. Bad Apple & FIXIT | $20 OFF! Any Service or Repair! Valid All Locations | All Locations | | \u2460\u2461\u2462
162. Body Balance Massage and Float | 2-4-1! 1 Hour Float (Sensory Deprivation) AF | American Fork | | \u2460\u2461
163. BYU Store | 50% OFF! Any Brigham Supply Company Item! Restrictions Apply | | Restrictions Apply | \u2460\u2461\u2462
164. BYU Studio 1030 | $10 OFF! Any Service! 25% OFF! Any Product! | | | \u2460\u2461\u2462
165. BYU Studio 1030 | $5 Haircut! Wash and Blow Dry Not Included | | Wash and Blow Dry Not Included | \u2460
166. BYU Studio 1030 | $5 OFF! Haircut Service! $5 OFF! Any Nail Service! | | | \u2460
167. BYU Studio 1030 | $5 OFF! Express Facial! | | | \u2460
168. Chiropractic Access Accident Center | Buy 1 Chiropractic Adjustment or Acupuncture Treatment For Only $15! | All Locations | | \u2460\u2461
169. Chiropractic Access Accident Center | Ozone Injection for Only $30! | All Locations | | \u2460\u2461
170. Classy Smiles | 50% OFF! Luxe or Luxe Duo Teeth Whitening! | | | \u2460
171. Durley Dry Cleaners | 2-4-1! Dry Cleaned or Laundered Item! Up to $20 | All UT Only | Up to $20 | \u2460\u2461
172. Fabulous Freddy's | 2-4-1! Basic Car Wash! Lehi | Lehi | | \u2460
173. Fabulous Freddy's | 2-4-1! VIP Car Wash! Lehi | Lehi | | \u2460\u2461
174. FORGE Jewelry Works | 30% OFF! Any Jewelry Item! Excl. Loose Diamonds/Gemstones | | Excl. Loose Diamonds/Gemstones | NO LIMIT
175. G.O.A.T Haircuts | $10 OFF! Any Men's Haircut! Please Tip! Call for Appt | | Please Tip Call for Appt | \u2460\u2461\u2462
176. Grease Monkey | $10 OFF! Full Service Oil Change! Same All Locations | All Locations | | NO LIMIT
177. Grease Monkey | 50% OFF! Full Service Conv. Oil Change! Lehi Herriman | Lehi (Pioneer Crs) Herriman | | NO LIMIT
178. Havoline | $20 OFF! Any Oil Change Service! | | | NO LIMIT
179. Havoline | $40 OFF! Brakes! per axle | | | NO LIMIT
180. Healing Vibes | 25% OFF! Emissions! | | | \u2460\u2461\u2462
181. Healing Vibes | 2-4-1! Foot Spa Massage! Orem | Orem | | \u2460\u2461
182. Jiffy Lube | $10 OFF! Vehicle Emissions! MSKCUZ | All Utah | MSKCUZ | \u2460
183. Jiffy Lube | $25 OFF! Any Oil Change! DBEUP2 | All Utah | DBEUP2 | NO LIMIT
184. Mandalyn Academy | 2-4-1! Any Facial or Luxury Back Treatment! | | | \u2460\u2461
185. Monster Pest Control | 50% OFF! Pest Control Treatment! New Customers! Up to $40! | Utah County | New Customers Up to $40 | \u2460\u2461\u2462
186. MTECH Cosmetology | $4 Haircut & Style! Lehi & SF | Lehi & SF | | \u2460
187. Paul Mitchell the School Provo | 50% OFF! a Blow Wax Service! | | | \u2460
188. Paul Mitchell the School Provo | 50% OFF! a Manicure or Pedicure! | | | \u2460\u2461
189. Revive PT Cryo | 2-4-1! Any Spa Amenity! Appointment Required | | Appointment Required | NO LIMIT
190. Revive PT Cryo | 2-4-1! Cryo Chamber! Appointment Required | | Appointment Required | \u2460\u2461\u2462
191. Revive PT Cryo | 2-4-1! One Hr Massage! Appointment Required | | Appointment Required | \u2460
192. Shiny Shell Carwash | 50% OFF! a Single Wash! All Utah Locations | All Utah | | \u2460
193. Tax Freedom Fighters | 50% OFF! Tax Preparation! | | | \u2460
194. Taylor Andrews Academy | $10 OFF! Hair Color Service | Provo & WJ | | \u2460\u2461\u2462
195. The Forum Academy | FREE! Haircut w/ Purchase of Any Dye or Chemical Service! | | | \u2460\u2461\u2462
196. UVU Store | 20% OFF! Any Single Art or School Supply Item! | | | \u2460\u2461
197. UVU Store | 20% OFF! Any UVU Apparel Item or UVU Emblematic Item | | Restrictions Apply | \u2460\u2461
198. ZAGG | 20% OFF! Any Glass Screen Protection Phone Case Headphones Power Bank or Bluetooth Keyboard! | UT County Stores | | \u2460\u2461

SECTION 5: FREE STUFF (85 deals)
=================================
199. 5 Star BBQ | FREE! Side Order of Fried Funeral Potatoes! | | | \u2460
200. 5 Star BBQ | FREE! Side! | | | \u2460
201. Auntie Anne's | FREE! Small Lemonade Mixer! | Lehi & Draper | | \u2460\u2461\u2462
202. Bad Apple & FIXIT | FREE! External Device Cleaning! | All Locations | | \u2460\u2461\u2462
203. Brazuca Pizza | FREE! 5oz Scoop Acai Sorbet! | | | \u2460
204. Bubbakoo's Burritos | FREE! Chicken Pork or Beef Taco! w/ Choice of Sauce! | | | \u2460
205. Buffalo Wild Wings | FREE! Order of Fried Pickles or Chips & Salsa! | Orem & Lehi | | \u2460
206. Burgers Supreme | FREE! Flavor Burst Ice Cream! Cone! | | | \u2460
207. BYU Outdoors Unlimited | FREE! Ski or Snowboard Rental! M-Th | | M-Th | \u2460
208. CHOM | FREE! Reg Order of Tater Tots Fries or Sweet Potato Fries! | | | \u2460
209. CLAS Ropes Course | FREE! Admission to Aerial Adventure Park! Reservation Req | | Reservation Required | \u2460
210. Classic Fun Center | FREE! Skating Climbing Bouncing or Laser Tag! Orem | Orem | | \u2460\u2461\u2462
211. Coin Crazy | FREE! Ice Cream Cone! | | | \u2460
212. Color Me Mine | FREE! Studio Admission! | | | \u2460
213. Culver's | FREE! Scoop of Frozen Custard! | Northern UT | | \u2460
214. Curry Pizza | FREE! Samosa! Lehi | Lehi | | \u2460
215. Dairy Queen | FREE! Small Ice Cream Cone! | Orem Vineyard EM & Santaquin | | \u2460
216. Daylight Donuts | FREE! Regular Donut! | Saratoga Springs | | \u2460
217. Domino's | FREE! Order of Oven-Baked Twists & Dip! Carryout Only | Saratoga & Eagle Mtn | Carryout Only | \u2460
218. El Beto | FREE! Medium Horchata! Provo | Provo | | \u2460
219. El Pollo Loco | FREE! Loco Value Menu Item! | Orem Lehi & Particip | | \u2460
220. Escapes In Time | FREE! Admission! M-Th. Not Valid December! | | M-Th Not Valid December | \u2460
221. Fabulous Freddy's | FREE! Best Exterior Car Wash! Lehi | Lehi | | \u2460
222. Franz Bakery Outlet | FREE! Loaf of Bread! All Utah Locations | All Utah | | \u2460
223. G.O.A.T Haircuts | FREE! Men's Ears Eyebrow or Nose Wax! Please Tip! Call for Appt | | Please Tip Call for Appt | \u2460
224. Game Grid | FREE! Board Game Rental and $5! Gift Card! Lehi | Lehi | | \u2460
225. Game Grid | FREE! Magic the Gathering Booster Pack! Lehi | Lehi | | \u2460
226. GetOut Games | FREE! Admit for ONE Person! M-Th only! | | M-Th only | \u2460\u2461\u2462
227. Improv Broadway | One FREE! Admission! | | | \u2460
228. Jamba Juice | FREE! Belgian Waffle Pretzel or Cheddar Tomato Twist! | Provo (University PKWY) UVU Campus Draper & WJ | | \u2460
229. Jersey Mikes | FREE! Chocolate Chip Cookie! | All Utah Only except EM and SF | | \u2460
230. Klucks Krispy Chicken | FREE! Order of Fried Chicken! (3 Pcs & 1 Sauce) | Saratoga | | \u2460
231. Kreative Kiln | FREE! Open Studio Session! | | | \u2460
232. LAN King | FREE! Hour of Game Time! | | | \u2460
233. Laser Assault | FREE! Game of Laser Tag! | | | \u2460
234. LoLo Hawaiian BBQ | FREE! Slice of Guava Cake or Spam Musubi! | All Locations | | \u2460
235. Lowes Xtreme Air Sports | FREE! Admission! Up to 2 Hrs | | Up to 2 Hrs | \u2460\u2461
236. Mandalyn Academy | FREE! Brow or Lip Wax! | | | \u2460\u2461
237. Mandalyn Academy | FREE! Nose OR Ear Wax! | | | \u2460\u2461
238. McDonald's | FREE! 12 oz. Frozen Drink! | All Orem N Provo PG Cedar Hills & AF | | \u2460
239. Melty | FREE! Small Melty Mac! | All Utah | | \u2460
240. MilkShake Factory | FREE! Any Chocolate Bark! | All UT | | \u2460\u2461
241. Mooyah | FREE! Small Shake! | | | \u2460
242. Nautical Bowls | FREE! Kayak (8oz) Nauti Sunrise or Paddle Bowl! | | | \u2460
243. Ninja Playground | FREE! Admission to Open Gym! | | | \u2460
244. Onoh's Malasada Co. | FREE! Sugar Malasada! | | | \u2460
245. Parlor Doughnuts | FREE! Carnival Doughnut! | | | \u2460
246. Paul Mitchell the School Provo | FREE! Haircut | | | \u2460
247. Paul Mitchell the School Provo | FREE! Straight Razor Face & Neck Shave or Beard Trim! | | | \u2460
248. Peaks Ice Arena | FREE! Admission! Skate Rental Not Included! | | Skate Rental Not Included | \u2460
249. Pita Pit | FREE! Pita Pit T-Shirt! | | | \u2460
250. Pizza Hut | FREE! Order of Cheese Sticks! Carryout Only! All Wasatch Front Locs | All Wasatch Front | Carryout Only | \u2460
251. Provo Bakery | FREE! Donut! | | | \u2460
252. Quench It! | FREE! Pretzel Bites! All Ut County & Bluffdale | All Ut County & Bluffdale | | \u2460\u2461\u2462
253. Quick Wits Comedy | FREE! Admission! | | | \u2460
254. Redline Racing | FREE! Race! Includes free helmet & headsock | | | \u2460
255. Roxberry Juice Co. | FREE! Mystery Mix Deep-freeze Smoothie! SF & partic. locs. | SF & partic. locs | | \u2460
256. Salsa at Southworth | FREE! Thurs Night Admission! | | | \u2460
257. Sip-N | FREE! 20oz Sip-N Fav! All Locations | All Locations | | \u2460
258. Sonic | FREE! Corndog! Valid at All Utah County Locations | All Utah County | | \u2460
259. Splash Drinks and Treats | FREE! One Bag of Cheddar Jalapeno or Butter Popcorn! Lehi | Lehi | | \u2460
260. Splash Summit Waterpark | FREE! Day Pass! Valid May & June | | Valid May & June | \u2460
261. Stadium Cinemas | FREE! Movie Ticket! | | | \u2460
262. Taco Time | FREE! Plain or Bavarian Creme Churro! Orem | Orem | | \u2460
263. Taste117 | FREE! 8oz. Frozen Hot Chocolate! | | | \u2460
264. Taste117 | FREE! Table-Side Chocolate Tasting! | | | \u2460
265. Taylor Andrews Academy | FREE! Haircut! M-Th Provo and WJ | Provo and WJ | M-Th | \u2460\u2461
266. The Forum Academy | FREE! Haircut! | | | \u2460
267. The Great Greek Mediterranean Grill | FREE! Feta Fry! | | | \u2460
268. The Pickr | FREE! 3 Hr Open Play Session! Lehi & Bluffdale | Lehi & Bluffdale | | \u2460
269. The Rift Augmented Reality | FREE! Admit 2 to Any Experience! Mon Only Provo | Provo | Mon Only | \u2460
270. The Ruth | FREE! Ticket to Any Youth Show! Select Seats Code: SSC | | Code: SSC | \u2460
271. The Smoked Taco | FREE! Order of Churro Fries! All Locations | All Locations | | \u2460
272. The Yard Milkshake Bar | FREE! Calf Cup! (1 Scoop Ice Cream) | | | \u2460
273. This Is The Place Heritage Park | One FREE! Admission! | | | \u2460\u2461
274. Tropical Smoothie Cafe | FREE! 12oz. Jetty Jr. Smoothie! All UT County | All UT County | | \u2460\u2461
275. Tsubame Rotating Sushi | FREE! Food Plate! Dine-in Only | | Dine-in Only | \u2460
276. Utah Country Dance | FREE! Saturday Admission! | | | \u2460
277. Utah Grizzlies | FREE! Ticket for Up to 2 People! Reg Season Only | | Reg Season Only | \u2460
278. UVU Athletics | FREE! Admission to Any UVU NCAA Home Sporting Event! | | Excludes Postseason | NO LIMIT
279. UVU Scoops | FREE! 22 oz. Fountain Drink! | | | \u2460
280. Village Inn | FREE! Slice of Pie! Provo | Provo | | \u2460
281. Wingstop | FREE! 5 Boneless Wings! All Northern UT locations | All Northern UT | | \u2460
282. Yogurtland | FREE! First 5 Ounces of Yogurt! | | | \u2460
283. Yummy's Korean BBQ | FREE! 2 Pcs Mandoo! | | | \u2460

SECTION 6: TREATS & DRINKS (88 deals)
======================================
284. Auntie Anne's | Buy 1 Classic Pretzel Get 1 FREE! | Lehi & Draper | | \u2462
285. Auntie Anne's | Buy Any 2 Menu Items Get a Third FREE! | Lehi & Draper | | \u2460
286. Avenue Bakery | 2-4-1! Savory Crepe and Drink! | | | \u2460\u2461\u2462
287. Avenue Bakery | 50% OFF! 1 Dozen Donuts! | | | \u2460\u2461\u2462
288. Avenue Bakery | Buy 1 Artisan Bread Get 1 FREE! | | | \u2460\u2461\u2462
289. Bahama Buck's | Buy 1 Shaved Ice or Smoothie Get 1 FREE! | | | \u2460\u2461
290. Baskin Robbins | 2-4-1! 2-Scoop Sundae! | Orem | | \u2460
291. Bobbys Burgers | Buy Any Shake Get 1 FREE! | | | \u2460
292. Brazuca Pizza | 2-4-1! Acai Bowl! | | | \u2460\u2461\u2462
293. Bruster's Ice Cream | 2-4-1! Ice Cream Sundae! | | | \u2460
294. Bruster's Ice Cream | 2-4-1! Waffle Cone & Ice Cream! | | | \u2460\u2461
295. Bruster's Ice Cream | Buy 1 Pint Quart or Half Gallon Ice Cream Get 1 50% OFF! | | | \u2460
296. Bubbakoo's Burritos | 50% OFF! Boardwalk Cookies (5 Deep Fried Oreos) or Other Dessert! | | | \u2460\u2461
297. Burgers Supreme | Buy Any Shake Get 1 FREE! | | | \u2460
298. BYU Store | Buy Any Food Candy or Fudge Get 1 50% OFF! | | | \u2460\u2461\u2462
299. Carl's Jr | 2 for $4 Ice Cream Shake! CODE 11685 | | CODE 11685 | \u2460\u2461\u2462
300. CHOM | 2-4-1! Any Reg Shake! | | | \u2460
301. Cinnabon | Buy Any Menu Item Get 1 FREE! | Orem | | \u2460
302. Cinnabon | Buy 1 Classic Cinnamon Roll Get 1 FREE! | Orem | | \u2460\u2461\u2462
303. Cinnaholic | 2-4-1! Gourmet Cinnamon Roll! | | | \u2461\u2462
304. Cold Stone Creamery | Buy 1 Love It or Gotta Have it Get 1 FREE! | Provo & SF | | \u2462
305. Cravings Alisha's Cupcakes | 2-4-1! Unicorn Float! | | | \u2461\u2462
305. Cravings Alisha's Cupcakes | 2-4-1! Unicorn Float! | | | \u2461\u2462
306. Cravings Alisha's Cupcakes | Buy Two Cupcakes Get 1 FREE! | | | \u2460\u2461\u2462
307. Cravings Bistro | Buy A Specialty Drink Get 1 FREE! | | | \u2460\u2461\u2462
308. Cravings Bistro | Buy Any Cookie Get 1 FREE! | | | \u2460\u2461\u2462
309. Culver's | 2-4-1! 2 Scoop Sundae or Medium Concrete Mixer! | Northern UT Locs | | \u2460\u2461\u2462
310. Dairy Queen | Buy a Blizzard Get 1 FREE! | Orem Vineyard EM & Santaquin | | \u2460\u2461\u2462
311. Daylight Donuts | 2-4-1! Reg Dozen Donuts! | Saratoga Springs | | \u2460\u2461\u2462
312. Dippin' Dots Fab Freddy's | 2-4-1! Regular Dippin' Dots! | Lehi | | \u2460\u2461\u2462
313. Franz Bakery Outlet | 2-4-1! Snack Cake or Loaf of Bread! | All UT | | \u2460\u2461\u2462
314. Freddy's Frozen Custard & Steakburgers | 2-4-1! Custard Cone or Dish! | All UT Locs | | \u2460
315. Great Harvest Bread Co. | 2-4-1! Cinnamon Roll Protein Bar or Cookie! | | | \u2460\u2461
316. Great Harvest Bread Co. | 2-4-1! Loaf of Bread! | | | \u2460
317. Gurus Cafe | Buy Pastry or Cake by the Slice Get One FREE! | Provo Cntr & UVU | | \u2460\u2461\u2462
318. Jack in the Box | Buy 1 Shake Get 1 FREE! | All Utah County | | \u2460\u2461\u2462
319. Jamba Juice | 50% OFF! Any Menu Item! | Provo (Univ PKWY) UVU Campus Draper & WJ | | \u2460\u2461\u2462
320. Jamba Juice | Buy Any Smoothie Get 1 FREE! | Same Locations | | \u2460\u2461\u2462
321. McDonald's | 2-4-1! Smoothie Shake or McCafe Drink! | All Orem N Provo PG Cedar Hills & AF | | \u2460
322. Melty | 2-4-1! Any Side or Dessert! | All Utah Locations | | \u2460\u2461
323. Melty | 50% OFF! Banana Foster Melt or Any Side or Dessert! | All Ut Locations | | \u2460\u2461
324. MidiCi The Neapolitan Pizza Company | 2-4-1! Italian Soda! | | | \u2460
325. MilkShake Factory | 2-4-1! Any Chocolate Molten Cup! | All UT Locations | | \u2460
326. MilkShake Factory | 2-4-1! Any Milkshake! | All UT Locations | | \u2460
327. Mooyah | 2-4-1! Shake! | | | \u2460\u2461\u2462
328. Mrs. Cavanaugh's Chocolates | 2-4-1! Single Scoop of Ice Cream! | | | \u2460
329. Mrs. Cavanaugh's Chocolates | 25% OFF! 1 Pound of Chocolate! | | | \u2460
330. Nautical Bowls | 2-4-1! Any Smoothie! | | | \u2460\u2461\u2462
331. Nothing Bundt Cakes | Buy 1 Bundtlet Get 1 FREE! | All Utah County | | \u2460\u2461\u2462
332. Onoh's Malasada Co | 50% OFF! Half Dozen Malasadas! | | | \u2460
333. Papa Murphy's | 2-4-1! Any Dessert or Side! | Provo & Park City | | \u2460
334. Parlor Doughnuts | Buy 1 Doughnut Get 1 FREE! | | | \u2460\u2461\u2462
335. Provo Bakery | 2-4-1! Donut! | | | \u2460\u2461\u2462
336. Provo Bakery | 50% OFF! Any Dozen Donuts! | | | \u2460\u2461\u2462
337. Quench It! | 2-4-1! Drink! Up to $2.75 | All Utah County & Bluffdale | | \u2460\u2461\u2462
338. Rocky Mountain Chocolate Factory | Buy 2 Caramel Apples Get a 3rd FREE! | Lehi | | \u2460\u2461\u2462
339. Roll Up Crepes | 2-4-1! Entree! Up to $7! | Orem & SF | | \u2460
340. Roll Up Crepes | 2-4-1! Nutella Shake! | Orem & SF | | \u2460
341. Roll Up Crepes | 50% OFF! Any Purchase! Up to $4! | Orem & SF | | \u2460\u2461
342. Rowley's Red Barn | 2-4-1! Small Apple Cider Slush a la Mode! | | | \u2460\u2461
343. Rowley's Red Barn | 2-4-1! Two-Scoop Ice Cream! | | | \u2460\u2461\u2462
344. Roxberry Juice Co. | 2-4-1! Smoothie! | Spanish Fork & Participating Locations | | \u2460\u2461\u2462
345. Sip-N | 2-4-1! Any Cookie! All Locations | All Locations | | \u2460\u2461\u2462
346. Sip-N | 2-4-1! Any Drink! All Locations | All Locations | | \u2460\u2461\u2462
347. Slurp | 2-4-1! Boba Drink! | | | \u2460
348. Sonic | 2-4-1! Shake! Valid at All Utah County Locations | All Utah County | | NO LIMIT
349. Splash Drinks and Treats | 2-4-1! Cookie! | Lehi | | \u2460\u2461
350. Splash Drinks and Treats | 2-4-1! Drink! Lehi Excludes Energy Drink Mixers | Lehi | Excludes Energy Drink Mixers | \u2460\u2461
351. Sub Zero Ice Cream | 2-4-1! Flavored Soda from the Soda Lab! | All Ut County | | \u2460\u2461\u2462
352. Sub Zero Ice Cream | Buy Any Ice Cream Get 1 FREE! | All Utah County | | \u2462
353. Sub Zero Ice Cream | Buy Any Italian Ice Get 1 FREE! | All Utah County | | \u2462
354. Taste117 | Buy Any 2 Drinks Get 2 Table Side Chocolate Tastings FREE! | | | \u2461\u2462
355. The Yard Milkshake Bar | Buy 1 Pint Cup Get 1 FREE! | | | \u2461\u2462
356. The Yard Milkshake Bar | Buy 1 Regular Milkshake Get 1 FREE! | | | \u2460\u2461\u2462
357. Tropical Smoothie Cafe | 2-4-1! Any Single Menu Item! | All UT County | | \u2460\u2461\u2462
358. Twisted Sugar | 2-4-1! Any Cookie or Drink! | PG & Saratoga Only | | \u2460\u2461\u2462
359. Twisted Sugar | 2-4-1! Any Smoothie or Soda! | PG & Saratoga Only | | \u2460\u2461\u2462
360. Twisted Sugar | 50% OFF! a Dozen Cookies! | PG & Saratoga Only | | \u2460
361. UVU Scoops | 2-4-1! Single Scoop of Ice Cream! | | | \u2460
362. Waffle Love | Buy Any Menu Item Get 1 FREE! | All Locations | | \u2460\u2461\u2462
363. Wayback Burgers | 2-4-1! Any Regular Milkshake! | PG & WJ | | \u2460\u2461\u2462
364. Yogurtland | 50% OFF! One Yogurt! | | | \u2461\u2462
365. Yogurtland | Buy One Yogurt Get One FREE! | | | \u2461\u2462
366. Yonutz | 2-4-1! Half Dozen Donuts! | Saratoga Springs | | \u2461\u2462
367. Yonutz | 2-4-1! Smashed or Simply Smashed Donut! | Saratoga Springs | | \u2460
368. Yonutz | 2-4-1! Smashed Shake! | Saratoga Springs | | \u2460\u2461
369. Yummy Ice Cream | 2-4-1! Hot Chocolate! FREE Arcades for Customers | | | \u2460\u2461
370. Yummy Ice Cream | 2-4-1! Any Hot Food Item! | | | NO LIMIT
371. Yummy Ice Cream | 2-4-1! Waffle Cone & Ice Cream! | | | NO LIMIT

SECTION 7: SANDWICHES & BURGERS (47 deals)
===========================================
372. 5 Star BBQ | Buy 1 Sandwich Get 1 FREE! | | | \u2460
373. Arby's | 2-4-1! Beef N' Cheddar Sandwich! Valid Particip. Locations | Participating Locations | | NO LIMIT
374. Arby's | 2-4-1! Classic Roast Beef Sandwich! Valid Particip. Locations | Participating Locations | | NO LIMIT
375. Bobbys Burgers | Buy Any Burger or Sandwich Get 1 FREE! | | | \u2460\u2461\u2462
376. Bobbys Burgers | Buy Any Burger and Side Get a Burger FREE! | | | \u2460\u2461\u2462
377. Burgers Supreme | Buy Any Burger or Sandwich Get 1 FREE! | | | \u2460\u2461
378. Carl's Jr | $3.99 Kids meal! Valid for All Kids in Family! Code 10717 | | Code 10717 | NO LIMIT
379. Carl's Jr | Buy a Sausage Egg and Cheese Biscuit Get 1 FREE! Code 7617 | | Code 7617 | \u2460\u2461\u2462
380. Carl's Jr | Buy a Western Bacon Cheeseburger Get 1 FREE! Code 10726 | | Code 10726 | \u2460\u2461\u2462
381. CHOM | Buy 1 Burger Get Reg Tater Tots Fries or Sweet Potato Fries & Reg Drink FREE! | | | \u2460
382. Culver's | 2-4-1! Culver's Deluxe! All Northern Utah Locations | All Northern Utah | | \u2460\u2461\u2462
383. Dairy Queen | 2-4-1! 4-Piece Chicken Strip Basket! | Orem Vineyard EM & Santaquin | | \u2460\u2461
384. Dairy Queen | Buy a Combo Meal Get One FREE! | Orem Vineyard EM & Santaquin | | \u2460\u2461
385. Dairy Queen | Buy 1 Sandwich or Burger Get 1 FREE! | Orem Vineyard EM & Santaquin | | \u2460\u2461\u2462
386. Domino's | 2-4-1! Hot Sandwich! Carryout Only | Saratoga & Eagle Mtn | Carryout Only | \u2460\u2461\u2462
387. Gandolfo's | 2-4-1! ANY Sandwich or Hot Dog! All Utah County | All Utah County | | \u2460\u2461\u2462
388. Gandolfo's | 2-4-1! Breakfast Sandwich! All Utah County | All Utah County | | \u2460\u2461\u2462
389. Great Harvest Bread Co. | 2-4-1! Breakfast or Lunch Sandwich! | | | \u2460\u2461
390. Honey Baked Ham | 2-4-1! Combo Meal! All Utah Locations | All Utah Locations | | NO LIMIT
391. Ike's | 2-4-1! Sandwich! | Lehi | | \u2460
392. Jack in the Box | Buy 1 Combo Get 1 Combo FREE! All Utah County | All Utah County | | \u2460\u2461\u2462
393. Jamba Juice | 2-4-1! Sandwich or Wrap! | Provo (University PKWY) UVU Campus Draper & WJ | | \u2460\u2461\u2462
394. JCW's | 2-4-1! Burger or Sandwich! All Locations | All Locations | | \u2460\u2461\u2462
395. Jersey Mikes | Buy 1 Reg. Sub Get a Reg. Sub FREE! All Ut Cnty excl. EM and SF | All Ut Cnty excl. EM and SF | | \u2460\u2461\u2462
396. Jersey Mikes | Buy Sub Get Chips and Reg. Size Drink FREE! All Ut Cnty excl. EM & SF | All Ut Cnty excl. EM & SF | | \u2460\u2460\u2461\u2462
397. Klucks Krispy Chicken | Buy 1 Entree & 2 Drinks Get 1 Entree FREE! | Saratoga | | \u2460
398. Klucks Krispy Chicken | Buy 1 Entree or Meal Get 1 50% OFF! | Saratoga | | \u2460\u2461\u2462
399. Marco's Pizza | 2-4-1! Toasted Sub! | Santaquin Only | | \u2460\u2461
400. McDonald's | 2-4-1! Kids Meal! All Orem N Provo PG Cedar Hills & AF | All Orem N Provo PG Cedar Hills & AF | | \u2460
401. McDonald's | 2-4-1! Sandwich! All Orem N Provo PG Cedar Hills & AF | All Orem N Provo PG Cedar Hills & AF | | \u2460
402. McDonald's | Buy Large Drink & Fry Get 1 Sandwich FREE! All Orem N Provo PG Cedar Hills & AF | All Orem N Provo PG Cedar Hills & AF | | \u2460
403. Melty | 2-4-1! Any Melt! All Utah Locations | All Utah Locations | | \u2460\u2461\u2462
404. Mooyah | 2-4-1! Any Burger Sandwich or Hot Dog! | | | \u2460\u2461\u2462
405. Mooyah | 50% OFF! Entire Purchase! Max $30 Discount | | Max $30 Discount | \u2460\u2461
406. Mooyah | Buy Any Burger Sandwich or Hot Dog Get Fries and a Drink FREE! | | | \u2460\u2461
407. Onoh's Malasada Co | 2-4-1! Any Sandwich! | | | \u2460
408. Parlor Doughnuts | Buy 1 Breakfast Sandwich Get 1 FREE! | | | \u2460
409. Pita Pit | 2-4-1! Entree! | | | \u2460\u2461\u2462
410. Pita Pit | Buy an Entree and a Side Get an Entree FREE! | | | \u2460\u2461
411. Sonic | 2-4-1! Sonic Cheeseburger! Valid at All Utah County Locations | All Utah County | | NO LIMIT
412. Tommy's Burgers | 2-4-1! Burger Combo! | | | \u2460
413. Tommy's Burgers | 2-4-1! Hot Dog Combo! | | | \u2460
414. Wayback Burgers | 2-4-1! Any Burger Sandwich or Hot Dog! | PG & WJ | | \u2461\u2462
415. Wayback Burgers | 2-4-1! Any Order of Chicken Tenders! | PG & WJ | | \u2460\u2461\u2462
416. Wendy's | FREE! Small Frosty w/ Any Purchase! Provo 122 E 1300 N Orem Center St N. Orem AF Highland Saratoga Traverse Mtn & Participating Locations | Provo 122 E 1300 N Orem Center St | | \u2460\u2461\u2462
417. Wendy's | Buy a Dave's Single or Spicy Chicken Get One FREE! Same Locations | Same Locations | | \u2460\u2461\u2462
418. Zub's Pizza & Sub's | Buy Any Sub Get 1 FREE! | | | \u2460
"""


def parse_usage(s):
    s = s.strip()
    if not s or s.upper() == 'NO LIMIT':
        return None  # unlimited
    circles = set()
    for c in s:
        if c == '\u2460': circles.add(1)
        elif c == '\u2461': circles.add(2)
        elif c == '\u2462': circles.add(3)
    return len(circles) if circles else 1


def make_value(title):
    t = title.upper()
    if '2-4-1' in t or '2 FOR' in t:
        return '2 for 1'
    if '50% OFF' in t:
        return '50% Off'
    if '25% OFF' in t:
        return '25% Off'
    if '20% OFF' in t:
        return '20% Off'
    if '30% OFF' in t:
        return '30% Off'
    if 'GET' in t and 'FREE' in t:
        return 'Buy 1 Get 1 Free'
    if t.startswith('FREE!') or t.startswith('ONE FREE'):
        return 'Free Item'
    m = re.search(r'\$(\d+) OFF', title)
    if m:
        return f'${m.group(1)} Off'
    m = re.search(r'(\d+)% OFF', title)
    if m:
        return f'{m.group(1)}% Off'
    return title[:30].rstrip('!').strip()


def make_description(location, restrictions):
    parts = []
    if location:
        parts.append(f'Valid at: {location}')
    if restrictions:
        parts.append(restrictions)
    if not parts:
        return 'Show your Starving Student Card at time of purchase.'
    return ' \u2022 '.join(parts)


def parse_all():
    deals = []
    seen_ids = set()
    current_section = None

    for line in RAW.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        # Detect section header
        m = re.match(r'SECTION\s+(\d+):', line)
        if m:
            current_section = int(m.group(1))
            continue

        # Detect deal line: starts with a number and period
        m = re.match(r'^(\d+)\.\s+(.+)$', line)
        if not m or current_section is None:
            continue

        num = int(m.group(1))
        rest = m.group(2)

        # Split on '|' and strip — handles empty fields like "A | | | B" correctly
        parts = [p.strip() for p in rest.split('|')]
        while len(parts) < 5:
            parts.append('')

        business      = parts[0].strip()
        deal_desc     = parts[1].strip()
        location      = parts[2].strip()
        restrictions  = parts[3].strip()
        usage_raw     = parts[4].strip()

        category = SECTION_MAP.get(current_section, 'other')

        # Deduplicate IDs (deal 305 appears twice in source)
        deal_id = f'{category}-{num:03d}'
        if deal_id in seen_ids:
            continue
        seen_ids.add(deal_id)

        max_uses = parse_usage(usage_raw)

        deal = {
            'id': deal_id,
            'name': business,
            'category': category,
            'address': '',
            'lat': None,
            'lng': None,
            'locationRestriction': location,
            'deal': {
                'title': deal_desc,
                'description': make_description(location, restrictions),
                'restrictions': restrictions,
                'value': make_value(deal_desc),
                'maxUses': max_uses,
                'expiresAt': '2026-12-31',
            },
            'contact': {
                'phone': None,
                'website': None,
                'hours': None,
            },
            'tags': [category],
        }
        deals.append(deal)

    return deals


if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path  = os.path.join(script_dir, 'src', 'data', 'deals.json')
    csv_path   = os.path.join(script_dir, 'deals_complete.csv')

    deals = parse_all()
    print(f'Parsed {len(deals)} deals')

    # Write JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)
    print(f'Wrote {json_path}')

    # Write CSV
    csv_fields = ['id', 'business', 'category', 'deal', 'location_restriction',
                  'restrictions', 'usage_limit', 'address', 'latitude', 'longitude']
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=csv_fields)
        w.writeheader()
        for d in deals:
            mu = d['deal']['maxUses']
            w.writerow({
                'id':                   d['id'],
                'business':             d['name'],
                'category':             d['category'],
                'deal':                 d['deal']['title'],
                'location_restriction': d['locationRestriction'],
                'restrictions':         d['deal']['restrictions'],
                'usage_limit':          'unlimited' if mu is None else str(mu),
                'address':              '',
                'latitude':             '',
                'longitude':            '',
            })
    print(f'Wrote {csv_path}')

    # Summary
    from collections import Counter
    cats = Counter(d['category'] for d in deals)
    for cat, count in sorted(cats.items()):
        print(f'  {cat}: {count}')
