import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

const btnCadastrar = document.getElementById("cadastrar") as HTMLButtonElement | null;

if (btnCadastrar) {
 btnCadastrar.addEventListener("click", () => {
 const emailInput = document.getElementById("email") as HTMLInputElement | null;
 const passwordInput = document.getElementById("senha") as HTMLInputElement | null;

 if (emailInput && passwordInput) {
 const email = emailInput.value;
 const senha = passwordInput.value;

 createUserWithEmailAndPassword(auth, email, senha)
 .then(() => {
 alert("Usuário cadastrado com sucesso!");
 })
 .catch((error: any) => {
 alert(error.message);
 });
 }
 });
}