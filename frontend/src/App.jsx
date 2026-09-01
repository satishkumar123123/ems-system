import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import WiderPage from './pages/WiderPage';
import UtilityPage from './pages/UtilityPage';
import WiderYoYPage from './pages/WiderYoYPage';
import UtilityYoYPage from './pages/UtilityYoYPage';
import HsuPage from './pages/HsuPage';
import HsuYoYPage from './pages/HsuYoYPage';
import NarrowFlatPage from './pages/NarrowFlatPage';
import NarrowFlatYoYPage from './pages/NarrowFlatYoYPage';
import NarrowTubePage from './pages/NarrowTubePage';
import NarrowTubeYoYPage from './pages/NarrowTubeYoYPage';
import AbplPage from './pages/AbplPage';
import SolarPage from './pages/SolarPage';
import SolarYoYPage from './pages/SolarYoYPage';

function Dashboard() {
  const navigate = useNavigate();

  const handleNavigate = (id) => {
    if (id === 'wider') navigate('/wider');
    else if (id === 'utility' || id === 'substation') navigate('/utility');
    else if (id === 'hsu' || id === 'hsg') navigate('/hsu');
    else if (id === 'narrow-flat' || id === 'nf') navigate('/narrow-flat');
    else if (id === 'narrow-tube' || id === 'ntd') navigate('/narrow-tube');
    else if (id === 'abpl') navigate('/abpl');
    else if (id === 'solar') navigate('/solar');
    else navigate(`/details/${id}`);
  };

  return (
    <div className="portal-wrapper">
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Montserrat:wght@700;900&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .portal-wrapper {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #e4e7ec;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .blueprint-stage {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #e4e7ec;
          background-image: radial-gradient(circle at 50% 50%, #f4f6f9 0%, #d8dce3 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          user-select: none;
        }

        .blueprint-doodles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          font-family: 'Caveat', cursive;
          color: #64748b;
          opacity: 0.38;
        }

        /* Scaled container to fit screen */
        .diagram-scaler {
          display: flex;
          justify-content: center;
          align-items: center;
          transform: scale(0.82);
          transform-origin: center center;
        }

        .schematic-grid {
          position: relative;
          width: 920px;
          height: 600px;
          z-index: 10;
        }

        /* 6 GLOWING CONNECTION TAILS */
        .flower-tail {
          position: absolute;
          pointer-events: none;
          z-index: 4;
          border-radius: 9999px;
          backdrop-filter: blur(4px);
        }

        .tail-ntd {
          width: 170px;
          height: 6px;
          top: 155px;
          left: 215px;
          transform: rotate(45deg);
          background: linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.9) 50%, rgba(207, 250, 254, 0.95) 100%);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .tail-wider {
          width: 170px;
          height: 6px;
          top: 155px;
          right: 215px;
          transform: rotate(-45deg);
          background: linear-gradient(90deg, rgba(207, 250, 254, 0.95) 0%, rgba(245, 158, 11, 0.9) 50%, rgba(254, 240, 138, 0.2) 100%);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .tail-solar {
          width: 250px;
          height: 6px;
          top: 50%;
          left: -20px;
          transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 114, 182, 0.9) 50%, rgba(253, 242, 248, 0.95) 100%);
          box-shadow: 0 0 14px rgba(236, 72, 153, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .tail-substation {
          width: 250px;
          height: 6px;
          top: 50%;
          right: -20px;
          transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(240, 249, 255, 0.95) 0%, rgba(56, 189, 248, 0.9) 50%, rgba(30, 64, 175, 0.2) 100%);
          box-shadow: 0 0 14px rgba(14, 165, 233, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .tail-nf {
          width: 170px;
          height: 6px;
          bottom: 155px;
          left: 215px;
          transform: rotate(-45deg);
          background: linear-gradient(90deg, rgba(244, 63, 94, 0.2) 0%, rgba(251, 113, 133, 0.9) 50%, rgba(255, 228, 230, 0.95) 100%);
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        .tail-hsg {
          width: 170px;
          height: 6px;
          bottom: 155px;
          right: 215px;
          transform: rotate(45deg);
          background: linear-gradient(90deg, rgba(209, 250, 229, 0.95) 0%, rgba(52, 211, 153, 0.9) 50%, rgba(16, 185, 129, 0.2) 100%);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.9);
        }

        /* TRAVELING FLOWER PULSES (FLOWING TOWARDS ABPL) */
        .traveling-flower {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 13px;
          pointer-events: none;
          z-index: 6;
        }

        .flow-fwd {
          animation: flowerTravelFwd 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .flow-rev {
          animation: flowerTravelRev 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes flowerTravelFwd {
          0% {
            left: 0%;
            opacity: 0;
            transform: translateY(-50%) scale(0.6) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translateY(-50%) scale(1.1) rotate(60deg);
          }
          85% {
            opacity: 1;
            transform: translateY(-50%) scale(1) rotate(300deg);
          }
          100% {
            left: 92%;
            opacity: 0;
            transform: translateY(-50%) scale(0.4) rotate(360deg);
          }
        }

        @keyframes flowerTravelRev {
          0% {
            right: 0%;
            opacity: 0;
            transform: translateY(-50%) scale(0.6) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translateY(-50%) scale(1.1) rotate(-60deg);
          }
          85% {
            opacity: 1;
            transform: translateY(-50%) scale(1) rotate(-300deg);
          }
          100% {
            right: 92%;
            opacity: 0;
            transform: translateY(-50%) scale(0.4) rotate(-360deg);
          }
        }

        /* FLOWER GLOW STYLES */
        .fl-ntd {
          background: radial-gradient(circle, #e0faff 30%, #22d3ee 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #06b6d4, 0 0 16px rgba(34, 211, 238, 0.8);
        }

        .fl-wider {
          background: radial-gradient(circle, #fef9c3 30%, #f59e0b 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #f59e0b, 0 0 16px rgba(245, 158, 11, 0.8);
        }

        .fl-solar {
          background: radial-gradient(circle, #fdf2f8 30%, #ec4899 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #ec4899, 0 0 16px rgba(236, 72, 153, 0.8);
        }

        .fl-utility {
          background: radial-gradient(circle, #f0f9ff 30%, #38bdf8 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #0ea5e9, 0 0 16px rgba(56, 189, 248, 0.8);
        }

        .fl-nf {
          background: radial-gradient(circle, #ffe4e6 30%, #f43f5e 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #f43f5e, 0 0 16px rgba(244, 63, 94, 0.8);
        }

        .fl-hsu {
          background: radial-gradient(circle, #ecfdf5 30%, #10b981 100%);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 10px #10b981, 0 0 16px rgba(16, 185, 129, 0.8);
        }

        /* 3D STATIONARY BLOOMING FLOWERS */
        .schematic-flower {
          position: absolute;
          z-index: 9;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatBloom 3.5s ease-in-out infinite alternate;
        }

        @keyframes floatBloom {
          0% {
            transform: translateY(0px) scale(0.96) rotate(0deg);
            filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
          }
          50% {
            transform: translateY(-5px) scale(1.06) rotate(3deg);
            filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.25));
          }
          100% {
            transform: translateY(3px) scale(1) rotate(-3deg);
            filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18));
          }
        }

        .flower-pos-ntd { top: 135px; left: 210px; animation-delay: 0s; }
        .flower-pos-wider { top: 135px; right: 210px; animation-delay: 0.6s; }
        .flower-pos-solar { top: 50%; left: 30px; transform: translateY(-50%); animation-delay: 1.2s; }
        .flower-pos-substation { top: 50%; right: 30px; transform: translateY(-50%); animation-delay: 1.8s; }
        .flower-pos-nf { bottom: 135px; left: 210px; animation-delay: 0.9s; }
        .flower-pos-hsg { bottom: 135px; right: 210px; animation-delay: 1.5s; }

        /* BASE 3D BLOCKS */
        .iso-3d-block {
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          z-index: 15;
          padding: 12px;
          border: none;
          outline: none;
        }

        .iso-3d-block:hover {
          transform: translateY(-8px) scale(1.03) !important;
        }

        /* 1. CENTER ABPL GEM */
        .gem-abpl {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          background: linear-gradient(135deg, #468ef7 0%, #2955d9 45%, #6a34c9 100%);
          border-radius: 26px;
          box-shadow: -12px 18px 30px rgba(26, 43, 107, 0.45), inset -4px -4px 10px rgba(0, 0, 0, 0.4), inset 4px 4px 12px rgba(255, 255, 255, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.5);
          z-index: 30;
        }

        .gem-abpl:hover {
          transform: translate(-50%, -50%) rotate(45deg) scale(1.06) !important;
          box-shadow: -15px 22px 40px rgba(26, 43, 107, 0.6);
        }

        .gem-abpl-content {
          transform: rotate(-45deg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .gem-abpl-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: 2px;
          background: linear-gradient(180deg, #fff2a8 0%, #e2ab25 60%, #9e6c02 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        /* 2. TOP-LEFT: NARROW TUBE */
        .block-ntd {
          top: 15px;
          left: 80px;
          background: linear-gradient(135deg, rgba(79, 219, 235, 0.9) 0%, rgba(22, 160, 182, 0.95) 100%), radial-gradient(circle at 20% 30%, #e0faff 0%, transparent 60%);
          border: 2px solid rgba(255, 255, 255, 0.7);
          box-shadow: -10px 16px 26px rgba(10, 94, 108, 0.3), inset 2px 2px 6px rgba(255, 255, 255, 0.7), inset -3px -3px 8px rgba(3, 56, 65, 0.5);
          clip-path: polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%);
        }

        .circuit-lines {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 75px;
          height: 60px;
          background-image: radial-gradient(#086270 2px, transparent 2px);
          background-size: 10px 10px;
          opacity: 0.7;
        }

        /* 3. BOTTOM-LEFT: NARROW FLAT */
        .block-nf {
          bottom: 15px;
          left: 80px;
          background: radial-gradient(circle at 80% 20%, #ff4b8b 0%, #870b3e 60%, #40011a 100%);
          border: 2px solid rgba(255, 180, 210, 0.6);
          box-shadow: -10px 16px 26px rgba(82, 6, 38, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.5), inset -3px -3px 8px rgba(0, 0, 0, 0.5);
          clip-path: polygon(0 0, 70% 0, 100% 30%, 100% 100%, 0 100%);
        }

        /* 4. MID-LEFT: SOLAR */
        .block-solar {
          top: 50%;
          left: -210px;
          transform: translateY(-50%);
          background: radial-gradient(circle at 25% 25%, #f472b6 0%, #ec4899 45%, #9d174d 100%);
          border: 2px solid rgba(251, 207, 232, 0.85);
          box-shadow: -14px 18px 30px rgba(157, 23, 77, 0.45), inset 2px 2px 8px rgba(255, 255, 255, 0.8), inset -3px -3px 8px rgba(80, 7, 36, 0.7);
          clip-path: polygon(0 20%, 20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
        }

        .block-solar:hover {
          transform: translateY(calc(-50% - 8px)) scale(1.03) !important;
          box-shadow: -18px 24px 36px rgba(157, 23, 77, 0.6);
        }

        /* 5. TOP-RIGHT: WIDER */
        .block-wider {
          top: 15px;
          right: 80px;
          background: linear-gradient(145deg, rgba(255, 222, 133, 0.85) 0%, rgba(227, 142, 28, 0.9) 100%);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 245, 204, 0.8);
          box-shadow: 10px 16px 26px rgba(153, 90, 10, 0.3), inset 2px 2px 8px rgba(255, 255, 255, 0.9), inset -3px -3px 8px rgba(120, 68, 2, 0.4);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 30% 100%, 0 70%);
        }

        /* 6. BOTTOM-RIGHT: HSU */
        .block-hsg {
          bottom: 15px;
          right: 80px;
          background: radial-gradient(circle at 30% 70%, #00d084 0%, #047857 50%, #022c22 100%);
          border: 2px solid rgba(167, 243, 208, 0.6);
          box-shadow: 10px 16px 26px rgba(2, 44, 34, 0.4), inset 2px 2px 6px rgba(255, 255, 255, 0.6), inset -3px -3px 8px rgba(0, 0, 0, 0.5);
          clip-path: polygon(30% 0, 100% 0, 100% 100%, 0 100%, 0 30%);
        }

        /* 7. MID-RIGHT: UTILITY */
        .block-substation {
          top: 50%;
          right: -210px;
          transform: translateY(-50%);
          background: radial-gradient(circle at 30% 30%, #38bdf8 0%, #1e40af 50%, #0f172a 100%);
          border: 2px solid rgba(186, 230, 253, 0.8);
          box-shadow: 14px 18px 30px rgba(15, 23, 42, 0.55), inset 2px 2px 8px rgba(255, 255, 255, 0.7), inset -3px -3px 8px rgba(2, 6, 23, 0.8);
          clip-path: polygon(0 0, 80% 0, 100% 20%, 100% 100%, 20% 100%, 0 80%);
        }

        .block-substation:hover {
          transform: translateY(calc(-50% - 8px)) scale(1.03) !important;
          box-shadow: 18px 24px 36px rgba(15, 23, 42, 0.7);
        }

        .plant-title-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.5px;
          z-index: 10;
          text-align: center;
          line-height: 1.15;
        }
      `}</style>

      <div className="blueprint-stage">
        {/* Background Formula Markings */}
        <div className="blueprint-doodles">
          <span style={{ position: 'absolute', top: '32px', left: '64px', fontSize: '24px', fontWeight: 'bold' }}>50 / 21</span>
          <span style={{ position: 'absolute', top: '48px', left: '256px', fontSize: '20px' }}>12 / 000</span>
          <span style={{ position: 'absolute', top: '144px', left: '48px', fontSize: '30px' }}>A)</span>
          <span style={{ position: 'absolute', top: '192px', right: '144px', fontSize: '24px' }}>V(A)</span>
          <span style={{ position: 'absolute', bottom: '96px', left: '56px', fontSize: '24px' }}>~ 100 /</span>
          <span style={{ position: 'absolute', bottom: '48px', left: '33%', fontSize: '20px' }}>∫ f(x)dx</span>
          <span style={{ position: 'absolute', bottom: '64px', right: '33%', fontSize: '24px' }}>E = mc²</span>
        </div>

        {/* Scaled Diagram Canvas */}
        <div className="diagram-scaler">
          <div className="schematic-grid">
            {/* Glowing Connection Tails with Flowing Theme Flowers towards ABPL */}
            <div className="flower-tail tail-ntd">
              <div className="traveling-flower fl-ntd flow-fwd" style={{ animationDelay: '0s' }}>
                🪷
              </div>
            </div>
            
            <div className="flower-tail tail-wider">
              <div className="traveling-flower fl-wider flow-rev" style={{ animationDelay: '0.4s' }}>
                🌻
              </div>
            </div>
            
            <div className="flower-tail tail-solar">
              <div className="traveling-flower fl-solar flow-fwd" style={{ animationDelay: '0.8s' }}>
                🌺
              </div>
            </div>
            
            <div className="flower-tail tail-substation">
              <div className="traveling-flower fl-utility flow-rev" style={{ animationDelay: '1.2s' }}>
                🪻
              </div>
            </div>
            
            <div className="flower-tail tail-nf">
              <div className="traveling-flower fl-nf flow-fwd" style={{ animationDelay: '0.6s' }}>
                🌹
              </div>
            </div>
            
            <div className="flower-tail tail-hsg">
              <div className="traveling-flower fl-hsu flow-rev" style={{ animationDelay: '1.0s' }}>
                🌼
              </div>
            </div>

            {/* 6 Stationary Blooming Flowers */}
            <div className="schematic-flower flower-pos-ntd">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-cyan-400 via-sky-200 to-white shadow-lg shadow-cyan-400/50 border-2 border-cyan-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🪷</span>
              </div>
            </div>

            <div className="schematic-flower flower-pos-wider">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-amber-400 via-yellow-200 to-white shadow-lg shadow-amber-400/50 border-2 border-amber-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🌻</span>
              </div>
            </div>

            <div className="schematic-flower flower-pos-solar">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-pink-500 via-rose-300 to-white shadow-lg shadow-pink-500/50 border-2 border-pink-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🌺</span>
              </div>
            </div>

            <div className="schematic-flower flower-pos-substation">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-indigo-500 via-sky-300 to-white shadow-lg shadow-sky-400/50 border-2 border-sky-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🪻</span>
              </div>
            </div>

            <div className="schematic-flower flower-pos-nf">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-rose-600 via-pink-300 to-white shadow-lg shadow-rose-600/50 border-2 border-rose-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🌹</span>
              </div>
            </div>

            <div className="schematic-flower flower-pos-hsg">
              <div className="relative group p-1.5 rounded-full bg-gradient-to-br from-emerald-500 via-teal-200 to-white shadow-lg shadow-emerald-500/50 border-2 border-emerald-100 flex items-center justify-center">
                <span style={{ fontSize: '24px' }}>🌼</span>
              </div>
            </div>

            {/* Center: ABPL */}
            <button
              type="button"
              onClick={() => handleNavigate('abpl')}
              className="iso-3d-block gem-abpl"
            >
              <div className="gem-abpl-content">
                <span className="gem-abpl-text">ABPL</span>
              </div>
            </button>

            {/* Top-Left: NARROW TUBE */}
            <button
              type="button"
              onClick={() => handleNavigate('narrow-tube')}
              className="iso-3d-block block-ntd"
            >
              <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#155e75', fontSize: '18px', opacity: 0.8 }}>
                <i className="fas fa-sitemap"></i>
              </div>
              <div className="circuit-lines"></div>
              <h3 className="plant-title-text" style={{ color: '#083344' }}>
                NARROW<br />TUBE
              </h3>
            </button>

            {/* Mid-Left: SOLAR */}
            <button
              type="button"
              onClick={() => handleNavigate('solar')}
              className="iso-3d-block block-solar"
            >
              <div
                style={{ position: 'absolute', top: '12px', right: '12px', color: '#fce7f3', fontSize: '20px', opacity: 0.9, animation: 'spin 12s linear infinite' }}
              >
                <i className="fas fa-sun"></i>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#fbcfe8', fontSize: '16px', opacity: 0.75 }}>
                <i className="fas fa-solar-panel"></i>
              </div>
              <h3 className="plant-title-text" style={{ color: '#ffffff' }}>
                SOLAR
              </h3>
            </button>

            {/* Bottom-Left: NARROW FLAT */}
            <button
              type="button"
              onClick={() => handleNavigate('narrow-flat')}
              className="iso-3d-block block-nf"
            >
              <div style={{ position: 'absolute', top: '12px', left: '12px', color: '#f472b6', fontSize: '16px', opacity: 0.8 }}>
                <i className="fas fa-crosshairs"></i>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: '#f472b6', fontSize: '16px', opacity: 0.8 }}>
                <i className="fas fa-bullseye"></i>
              </div>
              <h3 className="plant-title-text" style={{ color: '#fce7f3' }}>
                NARROW<br />FLAT
              </h3>
            </button>

            {/* Top-Right: WIDER */}
            <button
              type="button"
              onClick={() => handleNavigate('wider')}
              className="iso-3d-block block-wider"
            >
              <div style={{ position: 'absolute', top: '12px', right: '16px', color: '#92400e', fontSize: '24px', opacity: 0.9 }}>
                <i className="fas fa-arrow-trend-up"></i>
              </div>
              <h3 className="plant-title-text" style={{ color: '#451a03' }}>
                WIDER
              </h3>
            </button>

            {/* Mid-Right: UTILITY */}
            <button
              type="button"
              onClick={() => handleNavigate('utility')}
              className="iso-3d-block block-substation"
            >
              <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#7dd3fc', fontSize: '20px', opacity: 0.9 }}>
                <i className="fas fa-bolt"></i>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#bae6fd', fontSize: '16px', opacity: 0.8 }}>
                <i className="fas fa-tower-broadcast"></i>
              </div>
              <h3 className="plant-title-text" style={{ color: '#ffffff' }}>
                UTILITY
              </h3>
            </button>

            {/* Bottom-Right: HSU */}
            <button
              type="button"
              onClick={() => handleNavigate('hsu')}
              className="iso-3d-block block-hsg"
            >
              <div style={{ position: 'absolute', bottom: '8px', right: '12px', color: '#6ee7b7', fontSize: '24px', opacity: 0.9 }}>
                <i className="fas fa-seedling"></i>
              </div>
              <h3 className="plant-title-text" style={{ color: '#d1fae5' }}>
                HSU
              </h3>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px', background: '#ffffff', minHeight: '100vh', color: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '16px' }}>
        {id?.replace('-', ' ')} Page
      </h1>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '10px 20px', background: '#1e293b', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
      >
        Back to Home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wider" element={<WiderPage />} />
        <Route path="/wider/yoy" element={<WiderYoYPage />} />
        <Route path="/utility" element={<UtilityPage />} />
        <Route path="/utility/yoy" element={<UtilityYoYPage />} />
        <Route path="/hsu" element={<HsuPage />} />
        <Route path="/hsu/yoy" element={<HsuYoYPage />} />
        <Route path="/narrow-flat" element={<NarrowFlatPage />} />
        <Route path="/narrow-flat/yoy" element={<NarrowFlatYoYPage />} />
        <Route path="/narrow-tube" element={<NarrowTubePage />} />
        <Route path="/narrow-tube/yoy" element={<NarrowTubeYoYPage />} />
        <Route path="/abpl" element={<AbplPage />} />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="/solar/yoy" element={<SolarYoYPage />} />
        <Route path="/details/:id" element={<GenericDetails />} />
      </Routes>
    </Router>
  );
}