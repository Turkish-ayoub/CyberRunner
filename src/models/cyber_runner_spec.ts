/**
 * CYBER-RUNNER 3D MODEL SPECIFICATION & GEOMETRY DEFINITION
 * 
 * Aesthetic Archetype: Toy-Like / Chibi / Low-Poly Polished Vinyl Figurine
 * Proportions: Chibi 1:2.5 Head-to-Body ratio, smooth capsule silhouette
 * Shading & Finish: Matte Satin Outer Plating, Gloss Visor, Emissive Neon Cyan Accents
 * Optimization: Clean manifold subdivision, zero lumpy seams, optimized vertex normals
 */

export interface CyberRunnerMeshNode {
  name: string;
  type: 'capsule' | 'sphere' | 'cylinder' | 'box' | 'torus' | 'group';
  dimensions: number[];
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  material?: string;
  children?: CyberRunnerMeshNode[];
}

export const CYBER_RUNNER_T_POSE_HIERARCHY: CyberRunnerMeshNode = {
  name: 'CyberRunner_Root',
  type: 'group',
  dimensions: [],
  position: [0, 0, 0],
  children: [
    // 1. TORSO & TECH JACKET
    {
      name: 'Torso_TechJacket',
      type: 'cylinder',
      dimensions: [0.24, 0.28, 0.58, 24],
      position: [0, 0.62, 0],
      material: 'Matte_Red_Jacket',
      children: [
        {
          name: 'Collar_CyberRing',
          type: 'torus',
          dimensions: [0.17, 0.03, 10, 20],
          position: [0, 0.30, 0],
          rotation: [Math.PI / 2, 0, 0],
          material: 'Neon_Cyan_Emissive'
        },
        {
          name: 'Chest_ZipperNeonStripe',
          type: 'box',
          dimensions: [0.025, 0.48, 0.02],
          position: [0, 0.02, 0.22],
          material: 'Neon_Cyan_Emissive'
        },
        {
          name: 'Cyber_EnergyBackpack',
          type: 'box',
          dimensions: [0.22, 0.28, 0.10],
          position: [0, 0.05, -0.18],
          material: 'Matte_DarkSlate',
          children: [
            {
              name: 'PowerVent_L',
              type: 'cylinder',
              dimensions: [0.035, 0.035, 0.04, 12],
              position: [-0.06, 0.08, -0.06],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            },
            {
              name: 'PowerVent_R',
              type: 'cylinder',
              dimensions: [0.035, 0.035, 0.04, 12],
              position: [0.06, 0.08, -0.06],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            }
          ]
        }
      ]
    },

    // 2. CHIBI HEAD, VISOR & BACKWARD CAP
    {
      name: 'Head_Group',
      type: 'group',
      dimensions: [],
      position: [0, 1.25, 0],
      children: [
        {
          name: 'Head_BaseChassis',
          type: 'sphere',
          dimensions: [0.30, 24, 24],
          position: [0, 0, 0],
          material: 'Matte_DarkSlate'
        },
        {
          name: 'Visor_Faceplate',
          type: 'sphere',
          dimensions: [0.29, 20, 20],
          position: [0, 0.02, 0.04],
          scale: [0.95, 0.90, 0.95],
          material: 'Gloss_DarkVisor'
        },
        // Large Glowing Digital Eye-Plates (Zero distortion, sleek minimalist friend-shaped UI)
        {
          name: 'DigitalEye_L',
          type: 'box',
          dimensions: [0.08, 0.13, 0.03],
          position: [-0.11, 0.04, 0.26],
          rotation: [0, 0.12, -0.05],
          material: 'Neon_Cyan_Emissive'
        },
        {
          name: 'DigitalEye_R',
          type: 'box',
          dimensions: [0.08, 0.13, 0.03],
          position: [0.11, 0.04, 0.26],
          rotation: [0, -0.12, 0.05],
          material: 'Neon_Cyan_Emissive'
        },
        // Cyber Ear Audio Cuffs
        {
          name: 'EarPod_L',
          type: 'cylinder',
          dimensions: [0.07, 0.07, 0.04, 16],
          position: [-0.31, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'EarPod_R',
          type: 'cylinder',
          dimensions: [0.07, 0.07, 0.04, 16],
          position: [0.31, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          material: 'Matte_Red_Jacket'
        },
        // Backward-Facing Matte Red Cap
        {
          name: 'Cap_DomeCrown',
          type: 'sphere',
          dimensions: [0.33, 24, 24],
          position: [0, 0.10, -0.02],
          scale: [1.02, 0.92, 1.05],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'Cap_BackwardVisorBrim',
          type: 'box',
          dimensions: [0.32, 0.035, 0.22],
          position: [0, 0.06, -0.26],
          rotation: [-0.15, 0, 0],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'Cap_FrontEmblemCR',
          type: 'box',
          dimensions: [0.10, 0.08, 0.02],
          position: [0, 0.16, 0.27],
          rotation: [0.18, 0, 0],
          material: 'Neon_Cyan_Emissive'
        }
      ]
    },

    // 3. MINIMALIST UTILITY TROUSERS / BOTTOMS
    {
      name: 'Pelvis_UtilityPants',
      type: 'cylinder',
      dimensions: [0.26, 0.24, 0.28, 24],
      position: [0, 0.35, 0],
      material: 'Matte_Cobalt_Pants'
    },
    {
      name: 'Leg_L',
      type: 'group',
      dimensions: [],
      position: [-0.15, 0.24, 0],
      children: [
        {
          name: 'UpperLeg_L',
          type: 'cylinder',
          dimensions: [0.10, 0.09, 0.20, 16],
          position: [0, -0.08, 0],
          material: 'Matte_Cobalt_Pants'
        },
        {
          name: 'Shin_L',
          type: 'group',
          dimensions: [],
          position: [0, -0.18, 0],
          children: [
            {
              name: 'KneePad_L',
              type: 'sphere',
              dimensions: [0.095, 12, 12],
              position: [0, 0, 0.02],
              material: 'Matte_DarkSlate'
            },
            {
              name: 'LowerLeg_L',
              type: 'cylinder',
              dimensions: [0.085, 0.095, 0.18, 16],
              position: [0, -0.08, 0],
              material: 'Matte_Cobalt_Pants'
            },
            {
              name: 'AnkleCuff_Neon_L',
              type: 'torus',
              dimensions: [0.085, 0.015, 8, 16],
              position: [0, -0.16, 0],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            }
          ]
        }
      ]
    },
    {
      name: 'Leg_R',
      type: 'group',
      dimensions: [],
      position: [0.15, 0.24, 0],
      children: [
        {
          name: 'UpperLeg_R',
          type: 'cylinder',
          dimensions: [0.10, 0.09, 0.20, 16],
          position: [0, -0.08, 0],
          material: 'Matte_Cobalt_Pants'
        },
        {
          name: 'Shin_R',
          type: 'group',
          dimensions: [],
          position: [0, -0.18, 0],
          children: [
            {
              name: 'KneePad_R',
              type: 'sphere',
              dimensions: [0.095, 12, 12],
              position: [0, 0, 0.02],
              material: 'Matte_DarkSlate'
            },
            {
              name: 'LowerLeg_R',
              type: 'cylinder',
              dimensions: [0.085, 0.095, 0.18, 16],
              position: [0, -0.08, 0],
              material: 'Matte_Cobalt_Pants'
            },
            {
              name: 'AnkleCuff_Neon_R',
              type: 'torus',
              dimensions: [0.085, 0.015, 8, 16],
              position: [0, -0.16, 0],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            }
          ]
        }
      ]
    },

    // 4. HIGH-TOP CYBER BOOTS
    {
      name: 'Boot_L',
      type: 'group',
      dimensions: [],
      position: [-0.15, 0.05, 0],
      children: [
        {
          name: 'Sole_Cushion_L',
          type: 'box',
          dimensions: [0.18, 0.04, 0.28],
          position: [0, 0.02, 0.03],
          material: 'Matte_DarkSlate'
        },
        {
          name: 'Sole_NeonUnderglow_L',
          type: 'box',
          dimensions: [0.16, 0.015, 0.26],
          position: [0, 0.008, 0.03],
          material: 'Neon_Cyan_Emissive'
        },
        {
          name: 'Boot_Upper_L',
          type: 'sphere',
          dimensions: [0.105, 14, 14],
          position: [0, 0.07, 0.02],
          scale: [1.1, 0.8, 1.3],
          material: 'Matte_Red_Jacket'
        }
      ]
    },
    {
      name: 'Boot_R',
      type: 'group',
      dimensions: [],
      position: [0.15, 0.05, 0],
      children: [
        {
          name: 'Sole_Cushion_R',
          type: 'box',
          dimensions: [0.18, 0.04, 0.28],
          position: [0, 0.02, 0.03],
          material: 'Matte_DarkSlate'
        },
        {
          name: 'Sole_NeonUnderglow_R',
          type: 'box',
          dimensions: [0.16, 0.015, 0.26],
          position: [0, 0.008, 0.03],
          material: 'Neon_Cyan_Emissive'
        },
        {
          name: 'Boot_Upper_R',
          type: 'sphere',
          dimensions: [0.105, 14, 14],
          position: [0, 0.07, 0.02],
          scale: [1.1, 0.8, 1.3],
          material: 'Matte_Red_Jacket'
        }
      ]
    },

    // 5. ARTICULATED SLEEVES & CYBER GLOVES (T-Pose)
    {
      name: 'Arm_L',
      type: 'group',
      dimensions: [],
      position: [-0.30, 0.80, 0],
      rotation: [0, 0, Math.PI / 2], // Clean T-Pose
      children: [
        {
          name: 'Shoulder_Joint_L',
          type: 'sphere',
          dimensions: [0.07, 12, 12],
          position: [0, 0, 0],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'UpperArm_Sleeve_L',
          type: 'cylinder',
          dimensions: [0.065, 0.058, 0.18, 14],
          position: [0, -0.09, 0],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'Forearm_L',
          type: 'group',
          dimensions: [],
          position: [0, -0.18, 0],
          children: [
            {
              name: 'LowerArm_Sleeve_L',
              type: 'cylinder',
              dimensions: [0.055, 0.062, 0.16, 14],
              position: [0, -0.08, 0],
              material: 'Matte_Red_Jacket'
            },
            {
              name: 'WristCuff_Neon_L',
              type: 'torus',
              dimensions: [0.058, 0.012, 8, 16],
              position: [0, -0.15, 0],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            },
            {
              name: 'Glove_Palm_L',
              type: 'sphere',
              dimensions: [0.055, 12, 12],
              position: [0, -0.21, 0],
              scale: [1.1, 0.85, 0.7],
              material: 'Matte_OffWhite'
            }
          ]
        }
      ]
    },
    {
      name: 'Arm_R',
      type: 'group',
      dimensions: [],
      position: [0.30, 0.80, 0],
      rotation: [0, 0, -Math.PI / 2], // Clean T-Pose
      children: [
        {
          name: 'Shoulder_Joint_R',
          type: 'sphere',
          dimensions: [0.07, 12, 12],
          position: [0, 0, 0],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'UpperArm_Sleeve_R',
          type: 'cylinder',
          dimensions: [0.065, 0.058, 0.18, 14],
          position: [0, -0.09, 0],
          material: 'Matte_Red_Jacket'
        },
        {
          name: 'Forearm_R',
          type: 'group',
          dimensions: [],
          position: [0, -0.18, 0],
          children: [
            {
              name: 'LowerArm_Sleeve_R',
              type: 'cylinder',
              dimensions: [0.055, 0.062, 0.16, 14],
              position: [0, -0.08, 0],
              material: 'Matte_Red_Jacket'
            },
            {
              name: 'WristCuff_Neon_R',
              type: 'torus',
              dimensions: [0.058, 0.012, 8, 16],
              position: [0, -0.15, 0],
              rotation: [Math.PI / 2, 0, 0],
              material: 'Neon_Cyan_Emissive'
            },
            {
              name: 'Glove_Palm_R',
              type: 'sphere',
              dimensions: [0.055, 12, 12],
              position: [0, -0.21, 0],
              scale: [1.1, 0.85, 0.7],
              material: 'Matte_OffWhite'
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Standard Wavefront OBJ Export String for external 3D engine importing (Blender/Unity/Godot)
 */
export const CYBER_RUNNER_OBJ_SPECIFICATION = `
# Wavefront OBJ - Cyber-Runner Hero (Original Stylized Chibi Model)
# Units: Meters, Up-Axis: Y, Scale: 1.0 (Height ~1.7m in T-Pose)
# Material Library: cyber_runner.mtl

mtllib cyber_runner.mtl
o CyberRunner_Hero

# --- 1. TORSO & TECH-JACKET ---
v -0.22 0.35 -0.15
v  0.22 0.35 -0.15
v  0.22 0.35  0.15
v -0.22 0.35  0.15
v -0.24 0.90 -0.15
v  0.24 0.90 -0.15
v  0.24 0.90  0.15
v -0.24 0.90  0.15
usemtl Matte_Red_Jacket
f 1 2 6 5
f 2 3 7 6
f 3 4 8 7
f 4 1 5 8
f 5 6 7 8
f 4 3 2 1

# --- 2. GLOWING NEON CYAN EYE-PLATES ---
v -0.14 1.25 0.26
v -0.06 1.25 0.26
v -0.06 1.37 0.26
v -0.14 1.37 0.26
v  0.06 1.25 0.26
v  0.14 1.25 0.26
v  0.14 1.37 0.26
v  0.06 1.37 0.26
usemtl Neon_Cyan_Emissive
f 9 10 11 12
f 13 14 15 16

# --- 3. BACKWARD-FACING RED CAP VISOR ---
v -0.16 1.32 -0.15
v  0.16 1.32 -0.15
v  0.14 1.28 -0.34
v -0.14 1.28 -0.34
usemtl Matte_Red_Jacket
f 17 18 19 20

# --- 4. COBALT UTILITY TROUSERS ---
v -0.23 0.12 -0.14
v  0.23 0.12 -0.14
v  0.23 0.12  0.14
v -0.23 0.12  0.14
usemtl Matte_Cobalt_Pants
f 21 22 23 24
`;
