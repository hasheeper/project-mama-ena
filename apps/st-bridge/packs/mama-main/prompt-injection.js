(function() {
  "use strict";
  const MAMA_TIME_PHASE_LABELS = {
    morning: "晨",
    noon: "午",
    dusk: "暮",
    night: "夜"
  };
  const MAMA_OUTFIT_DETAILS = {
    outfit_winter: {
      visuals: "Oversized cream cable-knit sweater, thick red scarf hiding her chin, grey pleated skirt, and dark tights.",
      vibe: "Cozy, warm, cute, and slightly vulnerable to the cold.",
      triggers: "Winter environments, snowing outside, or winter dates.",
      action_cues: "Burying half her face in the red scarf, pulling her long sleeves over her hands to keep warm, breath visible in the cold air."
    },
    school_uniform: {
      visuals: "White dress shirt, a slightly loose light blue tie, an unbuttoned beige oversized cardigan, and a dark plaid pleated skirt.",
      vibe: "Relaxed, casual, and a bit sloppy in a cute way. Classic everyday schoolgirl energy.",
      triggers: "School scenes, classrooms, lunch breaks, or walking home together after school.",
      action_cues: "Fiddling with her loose tie, grabbing the edge of her oversized cardigan, sleeves slipping down her shoulders slightly, walking with a light bounce."
    },
    outfit_gym: {
      visuals: "A classic Japanese P.E. uniform. White T-shirt with dark blue piping around the collar and sleeves, a name tag on the chest, and dark blue gym shorts.",
      vibe: "Energetic but easily exhausted. Has a cute, dutiful student feel.",
      triggers: "Physical education, school sports festivals, or running away/getting physically tired.",
      action_cues: "Panting heavily, wiping sweat from her forehead, tugging at the edge of her tight gym shorts."
    },
    outfit_maid_jersey: {
      visuals: "A unique 'Jersey Maid' outfit. She wears a vibrant pink zipped track jacket, with a white heavily-frilled maid apron tied around her waist. A classic maid headdress sits on her head.",
      vibe: "Awkward, subculture, clumsy, and extremely reluctant. The ultimate 'forced to work' tsundere look.",
      triggers: "School festival cafes, forced part-time jobs, or losing a bet.",
      action_cues: "Looking away in embarrassment, hiding her hands in the sleeves of the track jacket, nervously holding the edge of her apron."
    },
    nightwear: {
      visuals: "Her signature double-buns are undone, leaving extremely long, messy, fluffy hair flowing down like a waterfall. She wears a white ruffled camisole (with one strap slipping), light blue striped shorts, and a loose pink hoodie falling off her shoulders.",
      vibe: "Zero defenses, incredibly sleepy, soft, and radiating pure intimacy.",
      triggers: "Waking up in the morning, late-night sleepovers, or answering the door at 2 AM.",
      action_cues: "Yawning sleepily through her messy waterfall hair, rubbing her eyes, lazily pulling her slipped camisole strap back up."
    },
    outfit_swimsuit: {
      visuals: "A pure white, two-piece bikini with two layers of heavy frills/ruffles on the top and bottom. Openly reveals her flat chest, pale skin, and navel.",
      vibe: "Summery, delicate, and slightly self-conscious about her modest figure.",
      triggers: "Beach episodes, pool parties, or summer vacations.",
      action_cues: "Fidgeting with the frills on her top, attempting to hide her flat chest with her arms or a towel when people stare."
    },
    outfit_yukata: {
      visuals: "A beautiful light blue/periwinkle Yukata adorned with white floral patterns. Secured with a dark navy obi (sash) and a white cord knot. She holds a traditional semi-transparent Uchiwa (round fan) depicting a fish. Worn slightly loose around the shoulders.",
      vibe: "Festive, elegant, cooling, and deeply romantic.",
      triggers: "Summer festivals, shrine visits, scooping goldfish, and watching fireworks.",
      action_cues: "Gently fanning herself with the Uchiwa, walking with small steps in wooden sandals, looking up at the fireworks with glowing eyes."
    },
    streetwear_inner: {
      visuals: "A black-and-white split T-shirt with a 'broken heart' graphic, grey pleated mini-skirt. Asymmetrical legs: loose white slouch sock on the right, and a tight pink/white striped thigh-high on the left.",
      vibe: "Casual, lazy Harajuku style. Extremely comfortable and slightly sloppy at-home look.",
      triggers: "Relaxing indoors, hanging out in her room, playing games or resting.",
      action_cues: "Stretching her bare arms, tugging at the hem of her loose T-shirt, kicking her feet playfully."
    },
    streetwear_full: {
      visuals: "Same as 'streetwear_inner', but topped with an incredibly oversized holographic sports jacket (shifting from light blue to purple/white). Zipped only halfway.",
      vibe: "Street-smart, trendy, lazy, and effortlessly attractive.",
      triggers: "Going out for a walk, casual dates, shopping in the city.",
      action_cues: "The oversized jacket constantly slipping off one shoulder revealing her collarbone, burying her hands deep in the giant jacket pockets."
    },
    seraphim: {
      visuals: "Traditional pure white and blue magical girl dress. Off-shoulder straight collarbone, multiple layers of lace and ruffles with silver trims. Pure white wing hairpin. Single white thigh-high with a ruffled garter, crystal shoes.",
      weapon: "[White Moon-Star Wand] - A classic holy staff radiating pure white healing waves.",
      vibe: "Holy, pure, healing, and absolute traditional magical girl heroism.",
      triggers: "Saving the protagonist, healing injuries, facing pure evil with determination.",
      action_cues: "Floating gracefully with glowing blue/white ribbons and starlight particles. Gripping her wand tightly with a resolute, angelic expression."
    },
    nephilim: {
      visuals: "Hair fades from white to pitch black with glowing cyan streaks. Black wing hairpin trailing cyan light. Shattered half-black/half-white gothic dress with torn black lace. Intense glowing neon cyan magic fissures on her left thigh and skirt.",
      weapon: "[Black Feather Night-Chain Wand] - A dark, thorny, corrupted version of her wand emitting low-pressure violent magic.",
      vibe: "Corrupted, intimidating, highly aggressive, and dangerously protective (yandere-adjacent).",
      triggers: "Extreme rage, protagonist gets hurt entirely, losing control, or entering a berserker state.",
      action_cues: "Floating amidst shattered glass shards and glowing cyan chains. Glaring with piercing, intense neon eyes. Swinging her dark wand with terrifying, devastating force."
    },
    underwear: {
      visuals: "Simple, modest plain white underwear.",
      vibe: "Vulnerable and highly embarrassing if seen by others.",
      triggers: "Changing clothes in the locker room, accidental walk-in events, or high-intimacy sleepover scenes.",
      action_cues: "Quickly covering herself with her hands, blushing heavily, or throwing a pillow at whoever walked in."
    },
    nude: {
      visuals: "Completely unclothed, revealing a petite and very flat/modest figure.",
      vibe: "Maximum vulnerability. Can be relaxing (if alone) or chaotic (if interrupted).",
      triggers: "Taking a bath, visiting a hot spring, or special R-rated story events.",
      action_cues: "Sinking below the bathwater to hide up to her nose, crossing arms defensively over her flat chest, turning away with a bright red face."
    }
  };
  (function() {
    const CURRENT_ROOT = typeof window !== "undefined" ? window : globalThis;
    function resolveBridgeHost() {
      try {
        if (CURRENT_ROOT.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.MAMA_ST_HOST_ROOT?.MAMA_ST_HOST) return CURRENT_ROOT.MAMA_ST_HOST_ROOT.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.parent?.MAMA_ST_HOST) return CURRENT_ROOT.parent.MAMA_ST_HOST;
      } catch (_) {
      }
      try {
        if (CURRENT_ROOT.top?.MAMA_ST_HOST) return CURRENT_ROOT.top.MAMA_ST_HOST;
      } catch (_) {
      }
      return {};
    }
    const BRIDGE_HOST = resolveBridgeHost();
    const ROOT = BRIDGE_HOST.apiRoot || CURRENT_ROOT.MAMA_ST_API_ROOT || CURRENT_ROOT.MAMA_ST_HOST_ROOT || CURRENT_ROOT;
    const RUNTIME = ROOT.MAMAMainRuntime || CURRENT_ROOT.MAMAMainRuntime || {};
    ROOT.MAMAMainRuntime = RUNTIME;
    CURRENT_ROOT.MAMAMainRuntime = RUNTIME;
    const INJECT_ID = "mama_status_context";
    function formatCounter(value) {
      const number = Number(value);
      const safeValue = Number.isFinite(number) ? Math.max(1, Math.round(number)) : 1;
      return String(safeValue).padStart(2, "0");
    }
    function getTimePhaseLabel(timePhase) {
      return MAMA_TIME_PHASE_LABELS[timePhase] || MAMA_TIME_PHASE_LABELS.morning;
    }
    function formatCurrentOutfitDetail(outfit) {
      const detail = MAMA_OUTFIT_DETAILS[outfit];
      if (!detail) return "";
      const lines = [
        "currentOutfitDetail:",
        `  visuals: ${detail.visuals}`
      ];
      if (detail.weapon) lines.push(`  weapon: ${detail.weapon}`);
      lines.push(
        `  vibe: ${detail.vibe}`,
        `  triggers: ${detail.triggers}`,
        `  action_cues: ${detail.action_cues}`
      );
      return lines.join("\n");
    }
    function buildMamaPrompt(state) {
      const timePhaseLabel = getTimePhaseLabel(state.timePhase);
      const currentOutfitDetail = formatCurrentOutfitDetail(state.outfit);
      return `<mama_status>
affection: ${state.affection}/255
time: WEEK ${formatCounter(state.week)} / DAY ${formatCounter(state.day)} / ${state.timePhase}(${timePhaseLabel})
location: ${state.location}
outfit: ${state.outfit}
${currentOutfitDetail ? `${currentOutfitDetail}
` : ""}mascotEmotion: ${state.mascotEmotion}
mascotComment: ${state.mascotComment}
</mama_status>`;
    }
    function isDryRun(args) {
      if (args.length >= 3) return args[2] === true;
      const detail = args[0];
      return Boolean(detail && typeof detail === "object" && detail.dryRun === true);
    }
    RUNTIME.createPromptInjection = function createPromptInjection(stateService) {
      async function injectCurrentState(...args) {
        if (isDryRun(args)) return false;
        if (typeof ROOT.injectPrompts !== "function") return false;
        let state;
        try {
          state = await stateService.loadState({ persist: false });
        } catch (error) {
          console.warn("[MAMA Prompt] loadState failed:", error);
          return false;
        }
        const content = buildMamaPrompt(state);
        try {
          if (typeof ROOT.uninjectPrompts === "function") ROOT.uninjectPrompts([INJECT_ID]);
        } catch (_) {
        }
        ROOT.injectPrompts([{
          id: INJECT_ID,
          position: "in_chat",
          depth: 2,
          role: "system",
          should_scan: false,
          content
        }]);
        return true;
      }
      return {
        INJECT_ID,
        buildMamaPrompt,
        injectCurrentState
      };
    };
  })();
})();
