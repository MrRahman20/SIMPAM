module.exports = {
  content: ["./**/*.{html,vue,svelte,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'popIn': 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'pulse-once': 'pulse 0.5s ease-in-out',
        'success-pop': 'pop-bounce 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
        'bounce-in': 'pop-bounce 0.6s cubic-bezier(.68,-0.55,.27,1.55)',
        'spin-slow': 'spin-slow 1.4s linear infinite'
      },
      keyframes: {
        'popIn': {
          '0%': { transform: 'scale(0.8) translateY(20px)', opacity: '0' },
          '70%': { transform: 'scale(1.05) translateY(-5px)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
        },
        'pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        },
        'pop-bounce': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '80%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    }
  }
}
