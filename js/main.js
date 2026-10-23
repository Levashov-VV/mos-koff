;(() => {
	'use strict'

	/* ---------- mobile menu ---------- */
	const menu = document.getElementById('nav')
	const toggle = document.getElementById('menubtn')
	const closeButton = document.getElementById('nav-close')

	if (menu && toggle) {
		const setMenu = open => {
			menu.classList.toggle('open', open)
			toggle.setAttribute('aria-expanded', String(open))
			toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню')
		}

		closeButton?.addEventListener('click', () => {
			setMenu(false)
		})
		toggle.addEventListener('click', () => {
			setMenu(!menu.classList.contains('open'))
		})

		menu.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', () => setMenu(false))
		})

		document.addEventListener('keydown', event => {
			if (event.key === 'Escape') setMenu(false)
		})
	}

	/* ---------- product cards: variant chips + thumbnails ---------- */
	document.querySelectorAll('[data-gallery]').forEach(card => {
		const variants = JSON.parse(card.dataset.gallery)
		const stage = card.querySelector('.stage img')
		const thumbs = card.querySelector('.thumbs')
		const chips = card.querySelectorAll('.chip')
		const name = card.querySelector('h3').textContent
		let current = variants[0]

		const show = i => {
			stage.src = current.images[i] + '.webp'
			stage.alt = name + ', ' + current.label.toLowerCase()
			thumbs
				.querySelectorAll('.thumb')
				.forEach((t, k) => t.classList.toggle('on', k === i))
		}
		const renderThumbs = () => {
			thumbs.innerHTML = ''
			if (current.images.length < 2) return
			current.images.forEach((p, i) => {
				const b = document.createElement('button')
				b.type = 'button'
				b.className = 'thumb' + (i === 0 ? ' on' : '')
				b.setAttribute('aria-label', 'Фото ' + (i + 1))
				b.innerHTML =
					'<img src="' +
					p +
					'-t.webp" alt="" width="120" height="90" loading="lazy">'
				b.addEventListener('click', () => show(i))
				thumbs.appendChild(b)
			})
		}
		thumbs
			.querySelectorAll('.thumb')
			.forEach((b, i) => b.addEventListener('click', () => show(i)))
		chips.forEach(chip =>
			chip.addEventListener('click', () => {
				current = variants.find(v => v.key === chip.dataset.key)
				chips.forEach(c => {
					const on = c === chip
					c.classList.toggle('on', on)
					c.setAttribute('aria-pressed', String(on))
				})
				renderThumbs()
				show(0)
			}),
		)
	})

	/* ---------- "Уточнить условия" pre-fills the form ---------- */
	const select = document.getElementById('modelselect')
	document.querySelectorAll('[data-model]').forEach(a =>
		a.addEventListener('click', () => {
			const v = a.dataset.model
			const opt = [...select.options].find(o => (o.value || o.text) === v)
			if (opt) select.value = opt.value || opt.text
		}),
	)

	/* ---------- lightbox ---------- */
	const box = document.getElementById('lightbox')
	const big = document.getElementById('lbimg')
	const items = [...document.querySelectorAll('.galleryitem')]

	if (box && big && items.length > 0) {
		let idx = 0

		const open = i => {
			idx = (i + items.length) % items.length
			big.src = items[idx].dataset.full
			big.alt = items[idx].dataset.alt || ''

			if (!box.open) box.showModal()
		}

		items.forEach((it, i) => {
			it.addEventListener('click', () => open(i))
		})

		document
			.getElementById('lbprev')
			?.addEventListener('click', () => open(idx - 1))
		document
			.getElementById('lbnext')
			?.addEventListener('click', () => open(idx + 1))
		document
			.getElementById('lbclose')
			?.addEventListener('click', () => box.close())

		box.addEventListener('click', e => {
			if (e.target === box) box.close()
		})

		box.addEventListener('close', () => big.removeAttribute('src'))

		box.addEventListener('keydown', e => {
			if (e.key === 'ArrowLeft') open(idx - 1)
			if (e.key === 'ArrowRight') open(idx + 1)
		})
	}

	/* ---------- lead form ---------- */
	const form = document.getElementById('leadform')
	const status = document.getElementById('formstatus')

	if (form && status) {
		const say = (msg, cls) => {
			status.textContent = msg
			status.className = 'formstatus ' + (cls || '')
		}

		form.addEventListener('submit', async e => {
			e.preventDefault()

			const name = form.elements.name
			const phone = form.elements.phone
			const consent = form.elements.consent

			;[name, phone].forEach(f => f.removeAttribute('aria-invalid'))

			const digits = phone.value.replace(/\D/g, '')

			if (!name.value.trim()) {
				name.setAttribute('aria-invalid', 'true')
				name.focus()
				return say('Укажите имя.', 'err')
			}

			if (digits.length < 10) {
				phone.setAttribute('aria-invalid', 'true')
				phone.focus()
				return say('Укажите телефон — не меньше 10 цифр.', 'err')
			}

			if (!consent.checked) {
				consent.focus()
				return say('Нужно согласие на обработку персональных данных.', 'err')
			}

			const btn = form.querySelector('button[type=submit]')
			btn.disabled = true
			say('Отправляем…')

			try {
				const res = await fetch(form.action, {
					method: 'POST',
					body: new FormData(form),
					headers: { Accept: 'application/json' },
				})

				const data = await res.json()
				if (!res.ok || !data.ok) throw new Error()

				form.reset()
				say('Заявка отправлена. Мы свяжемся с вами.', 'ok')
			} catch {
				say(
					'Не удалось отправить заявку. Попробуйте связаться с нами через Telegram или MAX.',
					'err',
				)
			} finally {
				btn.disabled = false
			}
		})
	}
})()

/* ---------- back to top ---------- */
;(() => {
	const backToTop = document.getElementById('back-to-top')

	if (backToTop) {
		const updateBackToTop = () => {
			backToTop.classList.toggle('is-visible', window.scrollY > 350)
		}

		window.addEventListener('scroll', updateBackToTop, {
			passive: true,
		})

		backToTop.addEventListener('click', () => {
			window.scrollTo({
				top: 0,
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
					? 'auto'
					: 'smooth',
			})
		})

		updateBackToTop()
	}

	/* ---------- scroll reveal animations ---------- */
	;(() => {
		const selectors = [
			'.sectionhead',
			'.product',
			'.extra',
			'.steps > *',
			'.galleryitem',
			'.contact',
		]

		const elements = document.querySelectorAll(selectors.join(', '))

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return
		}

		if (!('IntersectionObserver' in window)) {
			elements.forEach(element => {
				element.classList.add('is-visible')
			})
			return
		}

		// Небольшая задержка между карточками внутри одного ряда
		const groups = ['.products', '.extras', '.steps', '.gallerygrid']

		groups.forEach(selector => {
			document.querySelectorAll(selector).forEach(group => {
				Array.from(group.children).forEach((element, index) => {
					element.style.setProperty(
						'--reveal-delay',
						`${Math.min(index, 4) * 90}ms`,
					)
				})
			})
		})

		elements.forEach(element => {
			element.classList.add('reveal')
		})

		const observer = new IntersectionObserver(
			(entries, observer) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible')
						observer.unobserve(entry.target)
					}
				})
			},
			{
				threshold: 0.12,
				rootMargin: '0px 0px -25px 0px',
			},
		)

		elements.forEach(element => observer.observe(element))
	})()
	/* ---------- intro screen ---------- */
	;(() => {
		const intro = document.getElementById('intro-screen')

		if (!intro) return

		const progress = intro.querySelector('.intro-loader__progress')

		// Минимальное время показа заставки
		const MIN_DISPLAY_TIME = 2000

		const hideIntro = () => {
			if (!intro.isConnected) return

			intro.classList.add('is-hidden')

			// Удаляем после завершения CSS-перехода
			window.setTimeout(() => {
				intro.remove()
			}, 600)
		}

		// Если заставка уже была показана в этой вкладке,
		// показываем её снова при тестировании.
		// Пока отключаем проверку sessionStorage.

		if (progress) {
			progress.style.animation = 'none'
			void progress.offsetWidth
			progress.style.animation = ''
		}

		window.setTimeout(hideIntro, MIN_DISPLAY_TIME)
	})()
})()
