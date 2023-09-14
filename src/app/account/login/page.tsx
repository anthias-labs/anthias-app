"use client";

import styles from "../layout.module.scss";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useForm } from "@mantine/form";
import { TextInput, Button, Loader } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Login() {
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const session = await supabase.auth.getSession();
      if (session.data.session) {
        router.push(`/account`);
      }
    }
    checkSession();
  }, []);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    transformValues: (values) => ({
      ...values,

      email: values.email.toLowerCase(),
    }),

    validate: {
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? null
          : "Please enter valid input",
      password: (value) => {
        if (value.length < 8) {
          return "Must have at least 8 characters";
        }

        return null;
      },
    },
  });

  async function handleFormSubmit(values) {
    try {
      setErrorText("");
      setLoading(true);
      const user = await handleEmailLogin(values);
      if (user.user) {
        router.refresh();
        router.push(`/account`);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  async function handleEmailLogin(values) {
    let { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.toString().includes("Email not confirmed")) {
        setErrorText(
          "Email not confirmed. Please check your email for a confirmation link."
        );
      } else {
        setErrorText("Incorrect email or password. Please try again.");
      }
      console.log(error);
    }

    return data;
  }

  async function handleProviderLogin(provider) {
    if (provider === "google") {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          // redirectTo: `${window.location.origin}/account`,
        },
      });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: provider,
        // options: {
        //   redirectTo: `${window.location.origin}/account`,
        // },
      });
    }
  }

  return (
    <motion.div
      className={styles.userFlow}
      // initial={{ opacity: 0, y: 50 }}
      // animate={{
      //   opacity: [0, 1],
      //   y: [50, 0],
      // }}
      // transition={{
      //   duration: 0.2,
      //   delay: 0.1,
      // }}
    >
      <div className={styles.left}></div>
      <div className={styles.right}>
        <div className={styles.title}>Log In to Your Anthias Account</div>
        <form
          onSubmit={form.onSubmit((values) => {
            !loading && handleFormSubmit(values);
          })}
          className={styles.form}
        >
          <TextInput
            label="Email"
            placeholder="Email"
            {...form.getInputProps("email")}
            classNames={{
              root: styles.textInputRoot,
              label: styles.textInputLabel,
              input: styles.textInput,
            }}
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Password"
            {...form.getInputProps("password")}
            classNames={{
              root: styles.textInputRoot,
              label: styles.textInputLabel,
              input: styles.textInput,
            }}
          />
          {!loading ? (
            <Button type="submit">Log In</Button>
          ) : (
            <div className={styles.loading}>
              <Loader className={styles.loader} color="#1fcfcf" />
            </div>
          )}
          {errorText !== "" && <p className={styles.errorText}>{errorText}</p>}
        </form>
        <div className={styles.separator}>
          <div className={styles.line} />
          or
          <div className={styles.line} />
        </div>
        <div className={styles.alternatives}>
          <div
            className={`${styles.alternative} ${styles.discord}`}
            onClick={() => {
              handleProviderLogin("discord");
            }}
          >
            <svg
              width="31"
              height="24"
              viewBox="0 0 31 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M26.0015 1.9529C24.0021 1.03845 21.8787 0.37198 19.6623 0C19.3833 0.48048 19.0733 1.13144 18.8563 1.64292C16.4989 1.30193 14.1585 1.30193 11.8336 1.64292C11.6166 1.13144 11.2911 0.48048 11.0276 0C8.79575 0.37198 6.67235 1.03845 4.6869 1.9529C0.672601 7.8736 -0.41235 13.6548 0.130124 19.3585C2.79599 21.2959 5.36889 22.4739 7.89682 23.2489C8.51679 22.4119 9.07477 21.5129 9.55525 20.5675C8.64079 20.2265 7.77283 19.808 6.93587 19.312C7.15286 19.1571 7.36986 18.9866 7.57135 18.8161C12.6241 21.1255 18.0969 21.1255 23.0876 18.8161C23.3046 18.9866 23.5061 19.1571 23.7231 19.312C22.8861 19.808 22.0182 20.2265 21.1037 20.5675C21.5842 21.5129 22.1422 22.4119 22.7621 23.2489C25.2885 22.4739 27.8769 21.2959 30.5288 19.3585C31.1952 12.7559 29.4733 7.0212 26.0015 1.9529ZM10.2527 15.8402C8.73376 15.8402 7.49382 14.4608 7.49382 12.7714C7.49382 11.082 8.70276 9.7025 10.2527 9.7025C11.7871 9.7025 13.0425 11.082 13.0115 12.7714C13.0115 14.4608 11.7871 15.8402 10.2527 15.8402ZM20.4373 15.8402C18.9183 15.8402 17.6768 14.4608 17.6768 12.7714C17.6768 11.082 18.8873 9.7025 20.4373 9.7025C21.9717 9.7025 23.2271 11.082 23.1961 12.7714C23.1961 14.4608 21.9872 15.8402 20.4373 15.8402Z" />
            </svg>
            Log In With Discord
          </div>
          <div
            className={`${styles.alternative} ${styles.google}`}
            onClick={() => {
              handleProviderLogin("google");
            }}
          >
            <svg
              width="1179"
              height="1179"
              viewBox="0 0 1179 1179"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="589.5" cy="589.5" r="589.5" fill="white" />
              <path
                d="M204.294 392C174.234 451.288 157 518.192 157 589.499C157 660.807 174.234 727.711 204.294 786.999C204.294 787.397 351 673.225 351 673.225C342.182 646.785 336.97 618.743 336.97 589.495C336.97 560.246 342.182 532.205 351 505.765L204.294 392Z"
                fill="#FBBC05"
              />
              <path
                d="M598 509V679.564H835.137C824.724 734.417 793.476 780.863 746.61 812.092L889.613 923C972.931 846.129 1021 733.219 1021 599.091C1021 567.861 1018.2 537.83 1012.99 509.005L598 509Z"
                fill="#4285F4"
              />
              <path
                d="M350.426 673L318.171 697.706L204 786.69C276.507 930.59 425.117 1030 597.37 1030C716.344 1030 816.09 990.717 889 923.378L745.989 812.345C706.73 838.8 656.656 854.835 597.37 854.835C482.801 854.835 385.46 777.474 350.606 673.255L350.426 673Z"
                fill="#34A853"
              />
              <path
                d="M597.257 324.495C662.133 324.495 719.8 346.932 765.854 390.205L892 263.995C815.51 192.676 716.197 149 597.257 149C425.056 149 276.485 247.966 204 392.209L350.569 506C385.408 401.824 482.723 324.495 597.257 324.495Z"
                fill="#EA4335"
              />
            </svg>
            Log In With Google
          </div>
          <div
            className={`${styles.alternative} ${styles.github}`}
            onClick={() => {
              handleProviderLogin("github");
            }}
          >
            <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
                transform="scale(64)"
              />
            </svg>
            Log In With Github
          </div>
        </div>
        <div className={styles.wrongPage}>
          Don{"'"}t have an account?{" "}
          <Link href="/account/signup" className={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
