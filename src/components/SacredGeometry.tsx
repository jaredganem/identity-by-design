import { motion } from "framer-motion";

const NeuralNetwork = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Outer waveform ring */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10 animate-spin-slow"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2 }}
    />
    {/* Inner frequency ring */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/8"
      style={{ animationDirection: "reverse" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay: 0.3 }}
    />
    {/* Center neural glow */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full animate-pulse-slow"
      style={{ background: "radial-gradient(circle, hsl(195 100% 29% / 0.08), transparent)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.6 }}
    />
    {/* Waveform lines - horizontal */}
    <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 opacity-[0.04]" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <motion.path
        d="M0,60 Q100,20 200,60 T400,60 T600,60 T800,60 T1000,60 T1200,60"
        stroke="hsl(195 100% 29%)"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1 }}
      />
      <motion.path
        d="M0,60 Q150,90 300,60 T600,60 T900,60 T1200,60"
        stroke="hsl(197 90% 55%)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1.5 }}
      />
    </svg>
    {/* Ambient neural nodes */}
    <div
      className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-primary/20 animate-pulse-slow"
    />
    <div
      className="absolute top-[35%] right-[20%] w-1.5 h-1.5 rounded-full bg-accent/15 animate-pulse-slow"
      style={{ animationDelay: "1s" }}
    />
    <div
      className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full bg-primary/15 animate-pulse-slow"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="absolute bottom-[25%] right-[10%] w-32 h-32 rounded-full animate-pulse-slow"
      style={{ background: "radial-gradient(circle, hsl(195 100% 29% / 0.04), transparent)", animationDelay: "2s" }}
    />
  </div>
);

export default NeuralNetwork;
