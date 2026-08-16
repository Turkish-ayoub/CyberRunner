/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { History, BookOpen, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Cpu, ShieldAlert, Coins, Zap } from 'lucide-react';

interface EditorialProps {
  isRtl: boolean;
}

export default function Editorial({ isRtl }: EditorialProps) {
  return (
    <div className={`w-full max-w-5xl space-y-12 pb-16 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Gameplay Section */}
      <section id="gameplay" className="scroll-mt-24 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl"></div>
        
        <h3 className="font-display font-black text-2xl text-white mb-6 flex items-center gap-3 border-b border-neutral-800 pb-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          {isRtl ? 'طريقة اللعب وميكانيكيات المحرك المتقدمة' : 'Gameplay & Advanced Engine Mechanics'}
        </h3>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Controls Visual Guide - 5 cols */}
          <div className="space-y-4 lg:col-span-5">
            <h4 className="font-display font-bold text-lg text-neutral-300">
              {isRtl ? 'أزرار التحكم الأركيد السريعة:' : 'Arcade Control Console:'}
            </h4>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400">{isRtl ? 'القفز (تجنب الحواجز المنخفضة)' : 'Jump (Avoid Low Obstacles)'}</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white flex items-center gap-1">
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span className="text-[10px]">UP</span>
                  </kbd>
                  <span className="text-neutral-500 font-sans text-[11px] self-center mx-1">{isRtl ? 'أو' : 'or'}</span>
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white">{isRtl ? 'مسح لأعلى' : 'Swipe Up'}</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400">{isRtl ? 'الانزلاق (تحت حواجز النيون المعلقة)' : 'Slide (Under Hanging Neon Barriers)'}</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white flex items-center gap-1">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span className="text-[10px]">DOWN</span>
                  </kbd>
                  <span className="text-neutral-500 font-sans text-[11px] self-center mx-1">{isRtl ? 'أو' : 'or'}</span>
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white">{isRtl ? 'مسح لأسفل' : 'Swipe Down'}</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400">{isRtl ? 'تغيير الحارة (يسار / يمين)' : 'Switch Lane (Left / Right)'}</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </kbd>
                  <span className="text-neutral-500 font-sans text-[11px] self-center mx-1">{isRtl ? 'أو' : 'or'}</span>
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-white">{isRtl ? 'سحب أفقي' : 'Horizontal Swipe'}</kbd>
                </div>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-400">
              <p className="font-sans leading-relaxed">
                <strong>{isRtl ? 'نصيحة أركيد ممتازة:' : 'Pro-Arcade Tip:'}</strong>{' '}
                {isRtl 
                  ? 'اجمع العملات الذهبية واضرب مكعبات البيانات (Data Cubes) للحصول على دروع الحماية ومضاعف النقاط لتفجير طائرات الدرون!' 
                  : 'Gather Golden Coins and smash Data Cubes to trigger multipliers and score shields that blast Glitch Drones!'
                }
              </p>
            </div>
          </div>

          {/* Gameplay Detailed Breakdown - 7 cols */}
          <div className="space-y-6 text-neutral-400 text-sm leading-relaxed lg:col-span-7">
            <p>
              {isRtl 
                ? 'تقمص دور البطل سايبر رنر في مغامرته اللانهائية عبر الطرق الرقمية ثلاثية الأبعاد. تتطلب اللعبة سرعة فائقة في اتخاذ القرارات وردود فعل لحظية لتفادي حواجز النيون وطائرات الدرون المتنقلة.' 
                : 'In Cyber Runner 3D, you assume the role of an elite cybernetic operative racing down high-voltage neon highways. Dodge towering Neon Barriers, weave around patrolling Cyber Drones, and make split-second reflex decisions.'
              }
            </p>

            <ul className="list-disc list-inside space-y-2.5 pl-1 text-xs text-neutral-400 font-sans">
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'مقياس تسارع السرعة اللانهائي:' : 'Exponential Velocity Scaling:'}
                </strong>{' '}
                {isRtl 
                  ? 'يبدأ المتسابق الركض بسرعة أساسية قدرها 8.5 وحدة/ثانية. مع كل 100 متر يقطعها، تزداد السرعة تلقائياً بمقدار 0.05 وحدة/ثانية. هذا التسارع الديناميكي يرفع تدريجياً من صعوبة اللعب، ويبلغ الحد الأقصى الآمن عند 22.0 وحدة/ثانية لاختبار سرعة الاستجابة القصوى.'
                  : 'The runner starts at a base velocity of 8.5 units/second. For every 100 meters traversed, speed increments smoothly by 0.05 units/second up to 22.0 units/second for ultimate reflex testing.'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'نظام كشف التصادم الرقمي:' : 'Axis-Aligned Bounding Box (AABB) Collision:'}
                </strong>{' '}
                {isRtl 
                  ? 'نطبق خوارزميات تصادم متطورة تفحص المسافات بين المتسابق وحواجز النيون وطائرات الدرون. يمتلك المتسابق مجسم تصادم أسطواني بارتفاع 1.6 وحدة وعرض 0.6 وحدة. عند الانزلاق ينكمش الارتفاع إلى 0.7 وحدة للعبور تحت الحواجز المعلقة بأمان.'
                  : 'Precision bounding volumes detect neon barriers, flying drones, and hazards. The runner hitbox spans 1.6m high by 0.6m wide, compressing to 0.7m when sliding under hanging barriers.'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'نظام القوى الفائقة عالي الدوبامين الجديد:' : 'High-Dopamine 6-Tier Random Power-up Subsystems:'}
                </strong>{' '}
                {isRtl
                  ? 'يشمل النظام سلاح الليزر المحمول للقضاء على الحواجز بالضغط على مفتاح Space أو Shift، والقفزات المرتفعة لمضاعفة ارتفاع القفز، والحزام النفاث للطيران وجمع العملات الطائرة تلقائياً، والقرين الرقمي المرافق لمضاعفة النقاط، ومغناطيس جذب العملات بنصف قطر 15 وحدة، وتعديل نيترو لزيادة السرعة والحصانة الكاملة.'
                  : 'Features include the Volumetric Laser Blast (destroying obstacles ahead with Space/Shift), Super Rubber Bounce Jump (sky clearance), Cyber Jetpack Flight (vacuuming sky coins), Digital Hologram Companion, Magnetic Coin Vacuum (15.0m pull radius), and Cyber-Speed Nitro (invincibility and 3x multiplier).'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'التقاط العملات المغناطيسي ومحفظة الذهب:' : 'Magnetic Coin Harvesting & Golden Wallet:'}
                </strong>{' '}
                {isRtl 
                  ? 'يتم حساب المسافة بين المتسابق والعملات الطائرة في الفضاء الرقمي في كل إطار، وتخزين العملات المجمعة مباشرة في محفظة الذهب المحلية لتحديث رصيد المتجر تلقائياً.'
                  : 'Floating data-coins are pulled smoothly via delta-lerp, granting credits straight into your Golden Wallet for immediate shop upgrades and skin unlocks.'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'محرك النقاط والمضاعفات:' : 'Score Calculation Engine:'}
                </strong>{' '}
                {isRtl 
                  ? 'يتم دمج نقاط المسافة المقطوعة (نقطة واحدة لكل متر) مع قيمة العملات المجمعة (50 نقطة لكل عملة، أو 150 نقطة أثناء تفعيل النيترو) وضبطها بضربها في معامل المستوى الحالي.'
                  : 'Scores combine total distance covered and harvested data-coins, boosted dynamically by difficulty multipliers and active power-ups.'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'تكامل إعلانات CrazyGames و Poki للمكافآت:' : 'CrazyGames & Poki Monetization Hooks:'}
                </strong>{' '}
                {isRtl
                  ? 'تتيح خوارزمية المكافآت مشاهدة إعلانات الفيديو المجزية للحصول على عملات مجانية وتجربة الأبطال المتميزين، مع تفعيل إعلانات بينية سلسة كل ٣ جولات لعب.'
                  : 'Integrated with CrazyGames and Poki SDK standards (playRewardedAd for free coins/revives, and playInterstitialAd triggered every 3 game-overs).'
                }
              </li>
              <li>
                <strong className="text-neutral-300 font-mono">
                  {isRtl ? 'آلة الحالة المتزامنة وتجربة اللعب:' : 'Synchronized State Machine:'}
                </strong>{' '}
                {isRtl 
                  ? 'يتنقل النظام بسلاسة بين القوائم الرئيسية (IDLE)، وواجهة متجر الشخصيات (SHOP)، وشاشة اختيار المراحل (MAPS)، وحالة اللعب النشط (RUNNING).'
                  : 'Seamless coordination across IDLE, SHOP, MAPS, RUNNING, and GAMEOVER states with persistent inventory and active trial management.'
                }
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* History & Backstory Section */}
      <section id="history" className="scroll-mt-24 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl"></div>
        
        <h3 className="font-display font-black text-2xl text-white mb-6 flex items-center gap-3 border-b border-neutral-800 pb-3">
          <History className="w-6 h-6 text-pink-400" />
          {isRtl ? 'القصة الكاملة وخلفية سايبر رنر السيبرانية' : 'Full Lore & Backstory of Cyber Runner'}
        </h3>

        <div className="space-y-6 text-neutral-400 text-sm leading-relaxed">
          <p>
            {isRtl
              ? 'في عام 2026، تم اختراق الشبكة المركزية الفائقة من قبل ذكاء اصطناعي متمرد. تحولت المدن الرقمية إلى مسارات لانهائية مشبعة بالنيون والكهرباء عالية الجهد.'
              : 'In the year 2026, the central mainframe network was overtaken by a rogue AI Overlord. The digital cityscapes transformed into endless high-voltage neon highways known as the Cyber-Grid.'
            }
          </p>

          <p>
            {isRtl
              ? 'قام الذكاء الاصطناعي بنشر طائرات الدرون وحواجز النيون المعلقة لعزل المتسابقين وإيقاف تدفق البيانات الحيوية.'
              : 'The AI Overlord deployed patrol drones, energy grids, and high-voltage Neon Barriers to quarantine the system core and prevent the restoration of the digital grid.'
            }
          </p>

          <p>
            {isRtl
              ? 'تعتبر العملات الذهبية ومكعبات البيانات مفاتيح التشفير الأساسية التي يجمعها المتسابق لإعادة تشغيل النظام واستعادة السيطرة على المدينة.'
              : 'Harvested Golden Coins and Data Cubes carry decryption tokens needed to reboot subroutines, unlock elite cyberpunk operatives, and liberate the network.'
            }
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
              <h4 className="font-display font-bold text-sm text-pink-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neon-pink" />
                {isRtl ? 'مخاطر شبكة الليزر الحجمية:' : 'Volumetric Laser Hazards:'}
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {isRtl
                  ? 'تطلق أبراج الطاقة نبضات حرارية عالية التردد على جانبي المضمار، مما يتطلب من المتسابق تركيزاً دقيقاً وردود فعل فورية لتفادي الاحتراق.'
                  : 'High-voltage thermal energy surges pulse along the cyber track, demanding laser focus to weave through narrow safe channels.'
                }
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
              <h4 className="font-display font-bold text-sm text-cyan-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                {isRtl ? 'بروتوكولات التعديل وتجربة الأبطال:' : 'Operative Test-Drive Protocols:'}
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {isRtl
                  ? 'من خلال التفاعل مع بث المكافآت المجزي، يحصل اللاعب على فرصة لتجاوز متطلبات العملات وتجربة أبطال النخبة مثل Princess Nova أو Cobalt Operative لجولة كاملة.'
                  : 'Through rewarded sponsor links, players can bypass coin requirements and test-drive premium allies like Princess Nova or Cobalt Operative for a full trial run.'
                }
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-yellow-400 font-mono text-xs">
              <Star className="w-4 h-4 text-neon-yellow" />
              <span>{isRtl ? 'معالم تطور محرك سايبر رنر للأركيد:' : 'CYBER RUNNER ARCADE MILESTONES:'}</span>
            </div>
            <ul className="space-y-2.5 text-xs font-mono text-neutral-500">
              <li>• <strong className="text-neutral-300">Phase 1:</strong> {isRtl ? 'إطلاق محرك الجري ثلاثي الأبعاد WebGL فائق السرعة مع فيزياء AABB.' : 'High-speed WebGL 3D endless runner core with 60FPS physics and AABB bounding.'}</li>
              <li>• <strong className="text-neutral-300">Phase 2:</strong> {isRtl ? 'نظام القوى الست المتطورة (الليزر، الحزام النفاث، القفز المطاطي، النيترو، المغناطيس، والمرافق).' : '6-tier power-up ecosystem: Laser Blast, Jetpack Flight, Bounce, Nitro, Magnet, and Hologram Companion.'}</li>
              <li>• <strong className="text-neutral-300">Phase 3:</strong> {isRtl ? 'تكامل منصات CrazyGames و Poki لإعلانات المكافآت والمحفظة الذهبية.' : 'HTML5 Portal Monetization hooks: Rewarded ads, smart cycle interstitials, and Golden Wallet storage.'}</li>
              <li>• <strong className="text-neutral-300">Phase 4 (2026):</strong> {isRtl ? 'دعم شاشات اللمس الكامل بالسحب المتجاوب والإيماءات المتقدمة.' : 'Full Mobile/Tablet Touch Gestures, Swipe Engine, and Cyberpunk audio synthesizer.'}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="border-t border-neutral-800/80 pt-8 text-center text-xs text-neutral-600 font-mono space-y-2">
        <p>© 2026 - Cyber Runner 3D - HTML5 Cyberpunk Endless Runner. All Rights Reserved.</p>
        <p className="text-[10px] text-neutral-700">
          {isRtl 
            ? 'تم التطوير باستخدام تقنيات الويب المتطورة Three.js و Tailwind CSS كعرض تفاعلي عالي الأداء.' 
            : 'Engineered with WebGL, Three.js, custom audio synthesis, and responsive swipe controls.'
          }
        </p>
      </footer>

    </div>
  );
}
