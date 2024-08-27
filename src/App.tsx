import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import ClipboardDocumentCheckIcon from '@heroicons/react/24/outline/ClipboardDocumentCheckIcon';
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import EyeSlashIcon from '@heroicons/react/24/outline/EyeSlashIcon';
import QuestionMarkCircleIcon from '@heroicons/react/24/outline/QuestionMarkCircleIcon';
import { zxcvbnAsync } from '@zxcvbn-ts/core';
import copy from 'copy-to-clipboard';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Checkbox from './components/Checkbox';
import Frame from './components/Frame';
import PasswordButton from './components/PasswordButton';
import PasswordLengthField from './components/PasswordLengthField';
import PasswordScore from './components/PasswordScore';
import RadioButton from './components/RadioButton';
import Tooltip from './components/Tooltip';
import { PasswordSettings, generatePassword } from './utils/PasswordGenerator';
import {
  getStorageValue,
  setStorageValue,
  useLocalStorage,
} from './utils/localStorage';
import useDebouncedEffect from './utils/useDebouncedEffect';

function App() {
  const initialSettings: PasswordSettings = getStorageValue(
    'passwordSettings',
    {
      passwordLength: 16,
      mode: 'memo',
      withLowercase: true,
      withUppercase: true,
      withNumbers: true,
      withSymbols: true,
    },
  );

  const [password, setPassword] = useState(generatePassword(initialSettings));
  const [passwordScore, setPasswordScore] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useLocalStorage(
    'passwordHidden',
    true,
  );

  const { control, register, watch } = useForm<PasswordSettings>({
    defaultValues: initialSettings,
  });

  const settings = watch();

  const doSetPassword = (settings: PasswordSettings) => {
    setStorageValue('passwordSettings', settings);
    setPassword(generatePassword(settings));
    if (isCopied) setIsCopied(false);
  };

  useEffect(() => {
    const subscription = watch(doSetPassword);
    return () => subscription.unsubscribe();
  }, [watch]);

  const copyPassword = () => {
    const result = copy(password);
    setIsCopied(result);
  };

  const onChangePassword = (value: string) => {
    setPassword(value);
    if (isCopied) setIsCopied(false);
  };

  const calcPasswordScoreAsync = async () => {
    const { score } = await zxcvbnAsync(password);
    setPasswordScore(score);
  };

  const togglePasswordHidden = () => setIsPasswordHidden(!isPasswordHidden);

  useEffect(() => {
    calcPasswordScoreAsync();
  }, []);

  useDebouncedEffect(
    () => {
      calcPasswordScoreAsync();
    },
    200,
    [password],
  );

  return (
    <div className="max-w-screen-md mx-auto p-2">
      <header>
        <nav></nav>
        <h1 className="mt-8">
          Generador de contraseñas
        </h1>
      </header>
      <main className="flex flex-col gap-4 mt-6">
        <Frame className="p-2 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type={isPasswordHidden ? 'password' : 'text'}
              className="bg-transparent flex-1 w-0 font-mono text-2xl p-1 outline-none"
              name="password"
              placeholder="Escribe una contraseña..."
              value={password}
              onChange={({ target: { value } }) => onChangePassword(value)}
            />
            <Tooltip content="Copiar">
              <PasswordButton
                className="flex-none"
                disabled={password.length == 0}
                color={isCopied ? 'success' : 'primary'}
                onClick={copyPassword}
                aria-label="Copiar"
              >
                {isCopied ? (
                  <ClipboardDocumentCheckIcon className="w-6 h-6" />
                ) : (
                  <ClipboardDocumentIcon className="w-6 h-6" />
                )}
              </PasswordButton>
            </Tooltip>
            <Tooltip content={isPasswordHidden ? 'Mostrar' : 'Ocultar'}>
              <PasswordButton
                className="flex-none"
                onClick={togglePasswordHidden}
                aria-label={isPasswordHidden ? 'Mostrar' : 'Ocultar'}
              >
                {isPasswordHidden ? (
                  <EyeSlashIcon className="w-6 h-6" />
                ) : (
                  <EyeIcon className="w-6 h-6" />
                )}
              </PasswordButton>
            </Tooltip>
            <Tooltip content="Regenerar">
              <PasswordButton
                className="flex-none"
                onClick={() => doSetPassword(settings)}
                aria-label="Regenerar"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </PasswordButton>
            </Tooltip>
          </div>
          <div>
            <PasswordScore score={passwordScore} />
          </div>
        </Frame>
        <Frame className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-auto w-full sm:w-0">
              <Controller
                control={control}
                name="passwordLength"
                render={({ field }) => <PasswordLengthField field={field} />}
              />
            </div>
            <div className="flex-auto sm:flex-none space-y-1">
              <RadioButton id="m1" value="memo" {...register('mode')}>
                Fácil de recordar
                <Tooltip
                  content="Genera una palabra y números al azar para una contraseña fácil de leer y recordar."
                  placement="bottom"
                >
                  <span className="inline-block ml-2 opacity-60">
                    <QuestionMarkCircleIcon className="w-6 h-6" />
                  </span>
                </Tooltip>
              </RadioButton>
              <RadioButton id="m2" value="allChars" {...register('mode')}>
                Todos los caracteres
                <Tooltip
                  content="Genera cualquier combinación de caracteres para una contraseña más segura."
                  placement="bottom"
                >
                  <span className="inline-block ml-2 opacity-60">
                    <QuestionMarkCircleIcon className="w-6 h-6" />
                  </span>
                </Tooltip>
              </RadioButton>
            </div>
            <div
              className={`flex-auto sm:flex-none space-y-1 ${settings.mode == 'memo' ? 'invisible' : ''
                }`}
            >
              <Checkbox id="withUppercase" {...register('withUppercase')}>
                Mayúsculas
              </Checkbox>
              <Checkbox id="withLowercase" {...register('withLowercase')}>
                Minúsculas
              </Checkbox>
              <Checkbox id="withNumbers" {...register('withNumbers')}>
                Números
              </Checkbox>
              <Checkbox id="withSymbols" {...register('withSymbols')}>
                Símbolos
              </Checkbox>
            </div>
          </div>
        </Frame>
      </main>
      <footer className="mt-6">
        <p className="text-sm text-center">Ver código en <a href="https://github.com/vlantio/password-generator" target="_blank"><b>GitHub</b></a></p>
      </footer>
    </div>
  );
}

export default App;
