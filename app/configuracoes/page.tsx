"use client"

import { useState } from "react"
import { auth, db } from "../firebase"
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Moon, HelpCircle, FileText, LogOut, ChevronRight, Trash2, Mail, X } from "lucide-react"
import Header from "../componentes/Header"
import { useTema } from "../contexts/ThemeContext"
import { getCores } from "../cores"

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function Toggle({ ativo, onChange }: any) {
  const { isDark } = useTema()
  const cores = getCores(isDark)
  return (
    <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? cores.amarelo : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
    </button>
  )
}

function Secao({ icon: Icon, titulo, children }: any) {
  const { isDark } = useTema()
  const cores = getCores(isDark)
  return (
    <div style={{ backgroundColor: cores.branco, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <Icon size={18} color={cores.roxo} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>{titulo}</h3>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ItemToggle({ label, desc, ativo, onChange }: any) {
  const { isDark } = useTema()
  const cores = getCores(isDark)
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}` }}>
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
      </div>
      <Toggle ativo={ativo} onChange={onChange} />
    </div>
  )
}

function ItemAcao({ label, desc, onClick, icone: Icone, cor }: any) {
  const { isDark } = useTema()
  const cores = getCores(isDark)
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", borderBottom: `1px solid ${cores.fundo}`, cursor: "pointer", textAlign: "left" }}>
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: cor || cores.roxoEscuro }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
      </div>
      {Icone ? <Icone size={16} color={cor || cores.lavanda} /> : <ChevronRight size={16} color={cores.lavanda} />}
    </button>
  )
}

export default function Configuracoes() {
  const pathname = usePathname()
  const router = useRouter()
  const [notifs, setNotifs] = useState({ ativo: true, som: true, vibracao: true })
  const { isDark, toggleTema } = useTema()
  const cores = getCores(isDark)

  const [modalTermos, setModalTermos] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [senhaExcluir, setSenhaExcluir] = useState("")
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState("")

  function toggle(key: string) { setNotifs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] })) }

  function abrirEmail() {
    window.open("mailto:artemisreach@gmail.com?subject=Ajuda - Artemis", "_blank")
  }

  async function excluirConta() {
    setErroExcluir("")
    if (!senhaExcluir) { setErroExcluir("Digite sua senha para confirmar."); return }
    setExcluindo(true)
    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error("Usuário não encontrado")

      // Reautentica antes de excluir (exigência do Firebase)
      const cred = EmailAuthProvider.credential(user.email, senhaExcluir)
      await reauthenticateWithCredential(user, cred)

      // Apaga o documento do usuário
      await deleteDoc(doc(db, "usuarios", user.uid))

      // Exclui a conta
      await deleteUser(user)

      router.push("/")
    } catch (e: any) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setErroExcluir("Senha incorreta.")
      } else {
        setErroExcluir("Erro ao excluir conta. Tente novamente.")
      }
    }
    setExcluindo(false)
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 120px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Configurações</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "24px" }}>Personalize sua experiência no Artemis</p>

        {/* Notificações */}
        <Secao icon={Bell} titulo="Notificações">
          <ItemToggle label="Ativar notificações" desc="Receba alertas e atualizações importantes" ativo={notifs.ativo} onChange={() => toggle("ativo")} />
          <ItemToggle label="Som" desc="Toque sonoro para notificações" ativo={notifs.som} onChange={() => toggle("som")} />
          <ItemToggle label="Vibração" desc="Vibrar ao receber notificações" ativo={notifs.vibracao} onChange={() => toggle("vibracao")} />
        </Secao>

        {/* Aparência */}
        <Secao icon={Moon} titulo="Aparência">
          <ItemToggle
            label="Modo escuro"
            desc={isDark ? "Interface com cores escuras ativa" : "Interface com cores claras"}
            ativo={isDark}
            onChange={toggleTema}
          />
        </Secao>

        {/* Conta */}
        <Secao icon={Trash2} titulo="Conta">
          <ItemAcao label="Excluir minha conta" desc="Remove permanentemente sua conta e dados" onClick={() => setModalExcluir(true)} icone={Trash2} cor="#ef4444" />
        </Secao>

        {/* Suporte */}
        <Secao icon={HelpCircle} titulo="Suporte e Ajuda">
          <ItemAcao label="Central de ajuda" desc="Fale com nosso suporte" onClick={abrirEmail} icone={Mail} />
          <ItemAcao label="Termos de uso" desc="Leia nossos termos e condições" onClick={() => setModalTermos(true)} icone={FileText} />
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>Versão do aplicativo</p>
            <p style={{ margin: 0, fontSize: "13px", color: cores.lavanda }}>v1.0.0</p>
          </div>
        </Secao>

        {/* Sair */}
        <button onClick={async () => { await signOut(auth); router.push("/") }} style={{ width: "100%", padding: "14px", backgroundColor: "rgba(239,68,68,0.06)", color: "#ef4444", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <LogOut size={18} /> Sair da conta
        </button>
      </div>

      {/* Modal Termos de Uso */}
      {modalTermos && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ backgroundColor: cores.branco, borderRadius: "20px", padding: "24px", maxWidth: "420px", width: "100%", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "18px" }}>Termos de Uso</h3>
              <button onClick={() => setModalTermos(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={cores.lavanda} /></button>
            </div>
            <div style={{ fontSize: "13px", color: cores.roxoEscuro, lineHeight: "1.7" }}>
              <p>O Artemis é um aplicativo de segurança pessoal que permite compartilhar localização em tempo real com pessoas de confiança e acionar alertas de emergência.</p>
              <p><strong>1. Uso do aplicativo</strong><br />O Artemis deve ser usado exclusivamente para fins de segurança pessoal. O uso indevido dos recursos de alerta e localização é de responsabilidade do usuário.</p>
              <p><strong>2. Privacidade</strong><br />Sua localização só é compartilhada com os contatos que você adicionar ao seu círculo. Você pode desativar o compartilhamento a qualquer momento nas configurações.</p>
              <p><strong>3. Dados</strong><br />Seus dados são armazenados de forma segura e nunca são vendidos a terceiros.</p>
              <p><strong>4. Emergências</strong><br />O Artemis é uma ferramenta de apoio e não substitui os serviços oficiais de emergência (190, 180, 192).</p>
              <p style={{ color: cores.lavanda, fontSize: "12px", marginTop: "16px" }}>Última atualização: 2026</p>
            </div>
            <button onClick={() => setModalTermos(false)} style={{ width: "100%", marginTop: "16px", padding: "12px", backgroundColor: cores.roxo, color: isDark ? cores.fundo : "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Excluir Conta */}
      {modalExcluir && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ backgroundColor: cores.branco, borderRadius: "20px", padding: "24px", maxWidth: "380px", width: "100%" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h3 style={{ color: cores.roxoEscuro, margin: "0 0 8px", fontSize: "18px", textAlign: "center" }}>Excluir conta</h3>
            <p style={{ color: cores.lavanda, fontSize: "13px", textAlign: "center", margin: "0 0 20px", lineHeight: "1.5" }}>
              Esta ação é permanente e não pode ser desfeita. Digite sua senha para confirmar.
            </p>
            <input
              type="password"
              placeholder="Sua senha"
              value={senhaExcluir}
              onChange={(e) => setSenhaExcluir(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid #E8E0F5`, fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px", color: "#333" }}
            />
            {erroExcluir && <p style={{ color: "#ef4444", fontSize: "13px", margin: "0 0 12px", textAlign: "center" }}>{erroExcluir}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setModalExcluir(false); setSenhaExcluir(""); setErroExcluir("") }} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${cores.roxoClaro}`, background: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>
                Cancelar
              </button>
              <button onClick={excluirConta} disabled={excluindo} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar nav={nav} pathname={pathname} cores={cores} />
    </div>
  )
}

function NavBar({ nav, pathname, cores }: any) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: cores.branco, borderTop: `1px solid ${cores.fundo}`, display: "flex", justifyContent: "space-around", padding: "10px 0", boxShadow: "0 -2px 12px rgba(90,73,151,0.08)" }}>
      {nav.map((item: any) => {
        const ativo = pathname === item.href
        return (
          <Link key={item.label} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", color: ativo ? cores.roxo : "#aaa" }}>
            <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}><item.icon size={20} /></div>
            <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}