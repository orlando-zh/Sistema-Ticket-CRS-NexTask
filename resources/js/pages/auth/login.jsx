import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [throttleSeconds, setThrottleSeconds] = useState(0);

    // Detecta el error de throttle y extrae los segundos
    useEffect(() => {
        if (errors.email) {
            const match = errors.email.match(/(\d+)\s*segundo/i);
            if (match) {
                setThrottleSeconds(parseInt(match[1]));
            }
        }
    }, [errors.email]);

    // Countdown regresivo
    useEffect(() => {
        if (throttleSeconds <= 0) return;
        const timer = setInterval(() => {
            setThrottleSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [throttleSeconds]);

    const isThrottled = throttleSeconds > 0;

    const submit = (e) => {
        e.preventDefault();
        if (isThrottled) return;
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Iniciar Sesión" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
                .font-bebas { font-family: 'Bebas Neue', sans-serif; }
                .font-dm    { font-family: 'DM Sans', sans-serif; }
                .field-input:focus {
                    border-color: #DA291C !important;
                    background: #fff !important;
                    box-shadow: 0 0 0 4px rgba(218,41,28,0.08) !important;
                    outline: none;
                }
            `}</style>

            <div className="font-dm min-h-screen flex items-center justify-center bg-transparent p-4">

                {/* MODIFICACIÓN 1: flex-col para móvil y md:flex-row para PC */}
                <div className="flex flex-col-reverse md:flex-row w-full max-w-[820px] min-h-[480px] rounded-[22px] overflow-hidden bg-white"
                     style={{ boxShadow: '0 35px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)' }}>

                    {/* ───────── LEFT (FORMULARIO) ───────── */}
                    {/* MODIFICACIÓN 2: Padding adaptable (px-6 en móvil, px-11 en PC) */}
                    <div className="flex-1 bg-white flex flex-col justify-center px-6 py-10 md:px-11 relative">

                        <div className="absolute left-0 top-0 w-[5px] h-full bg-[#DA291C]" />

                        <h1 className="font-bebas text-[2.2rem] text-[#111] tracking-wide mb-1 text-center md:text-left">
                            Iniciar Sesión
                        </h1>

                        <p className="text-[0.78rem] text-[#777] mb-7 text-center md:text-left">
                            Ingresa tus credenciales para continuar
                        </p>

                        <form onSubmit={submit}>

                            <div className="flex flex-col gap-4 mb-4">

                                {/* EMAIL */}
                                <div>
                                    <label htmlFor="email"
                                           className="block text-[0.68rem] font-bold uppercase tracking-[1.2px] text-[#444] mb-[0.35rem]">
                                        Correo electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#999] pointer-events-none" />
                                        <input
                                            id="email"
                                            type="email"
                                            maxLength={100}
                                            className="field-input w-full py-[0.72rem] pr-[0.9rem] pl-10 rounded-[10px] border-[1.5px] border-[#e5e5e5] bg-[#fafafa] text-[0.86rem] font-dm placeholder-[#c4c4c4]"
                                            placeholder="correo@ejemplo.com"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            tabIndex={1}
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value.replace(/\s/g, ''))}
                                            onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData('text').replace(/\s/g, '');
                                                setData('email', pasted);
                                            }}
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <label htmlFor="password"
                                           className="block text-[0.68rem] font-bold uppercase tracking-[1.2px] text-[#444] mb-[0.35rem]">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#999] pointer-events-none" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="field-input w-full py-[0.72rem] pr-10 pl-10 rounded-[10px] border-[1.5px] border-[#e5e5e5] bg-[#fafafa] text-[0.86rem] font-dm placeholder-[#c4c4c4]"
                                            placeholder="••••••••"
                                            required
                                            autoComplete="current-password"
                                            tabIndex={2}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#999] flex items-center justify-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            {/* RECORDAR */}
                            <div className="flex items-center justify-between my-3 mb-[1.3rem]">
                                <div className="flex items-center gap-[0.45rem]">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked)}
                                    />
                                    <label htmlFor="remember" className="text-[0.78rem] text-[#666]">
                                        Recordarme
                                    </label>
                                </div>
                            </div>

                            {/* BOTÓN */}
                            <button
                                type="submit"
                                disabled={processing || isThrottled}
                                className="font-bebas w-full py-[0.82rem] border-none rounded-xl bg-[#DA291C] text-white text-[1rem] tracking-[2px] cursor-pointer flex items-center justify-center gap-[0.45rem] disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ boxShadow: '0 10px 25px rgba(218,41,28,0.30)' }}
                            >
                                {processing && <LoaderCircle size={18} className="animate-spin" />}
                                {isThrottled ? `Espera ${throttleSeconds}s` : 'Iniciar sesión'}
                            </button>

                        </form>

                        {status && (
                            <div className="mt-4 text-center text-[0.82rem] text-green-600 font-medium">
                                {status}
                            </div>
                        )}
                    </div>

                    {/* ───────── RIGHT (BANNER ROJO) ───────── */}
                    {/* MODIFICACIÓN 3: w-full en móvil y w-80 en PC */}
                    <div className="w-full md:w-80 flex flex-col items-center justify-center p-8 relative overflow-hidden py-10 md:py-8"
                         style={{ background: 'linear-gradient(180deg, #DA291C 0%, #b6160d 100%)' }}>

                        <div className="absolute w-[260px] h-[260px] rounded-full -top-20 -right-20"
                             style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="absolute w-[180px] h-[180px] rounded-full -bottom-12 -left-12"
                             style={{ background: 'rgba(0,0,0,0.08)' }} />

                        {/* logo card */}
                        <div className="relative z-10 bg-white rounded-[18px] p-4 border-4 border-[#111]"
                             style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1)' }}>
                            {/* MODIFICACIÓN 4: Logo más pequeño en móvil (w-[140px]) y grande en PC (md:w-[220px]) */}
                            <img
                                src="/img_cruzroja.webp"
                                alt="Cruz Roja Salvadoreña"
                                className="w-[140px] md:w-[220px] h-auto block object-contain select-none pointer-events-none"
                                draggable={false}
                            />
                        </div>

                        <p className="relative z-10 mt-6 text-white/80 text-[0.72rem] uppercase tracking-[2px] font-light text-center">
                            Sistema de Gestión
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}
