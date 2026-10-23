;(() => {
	'use strict'

	/* ---------- mobile menu ---------- */
	const menu = document.getElementById('nav')
	const toggle = document.getElementById('menubtn')
	const closeButton = document.getElementById('nav-close')

	if (menu && toggle) {
		const setMenu = open => {
			menu.classList.toggle('open', open)
			document.body.classList.toggle('menu-open', open)

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

	/* ---------- product cards: variant chips + thumbnails + swipe ---------- */
	document.querySelectorAll('[data-gallery]').forEach(card => {
		const variants = JSON.parse(card.dataset.gallery)
		const stage = card.querySelector('.stage')
		const stageImg = stage?.querySelector('img')
		const thumbs = card.querySelector('.thumbs')
		const chips = card.querySelectorAll('.chip')
		const title = card.querySelector('h3')?.textContent || 'Кофемашина'

		if (!stage || !stageImg || !thumbs || !variants.length) return

		let current = variants[0]
		let currentIndex = 0
		let startX = 0
		let startY = 0
		let pointerId = null

		const imageCache = new Map()
		let imageRequest = 0

		const preloadImage = src => {
			const img = new Image()
			img.decoding = 'async'
			img.src = src
			return img
		}

		// Заранее загружаем первые фото каждого варианта
		variants.forEach(variant => {
			const path = variant.images?.[0]
			if (!path) return

			const src = path + '.webp'
			if (imageCache.has(src)) return

			const img = new Image()
			img.decoding = 'async'
			img.src = src

			imageCache.set(src, img)
		})

		const show = async index => {
			if (!current.images.length) return

			const selectedIndex =
				(index + current.images.length) % current.images.length

			const src = current.images[selectedIndex] + '.webp'
			const request = ++imageRequest
			const selectedVariant = current

			let img = imageCache.get(src)

			if (!img) {
				img = preloadImage(src)
				imageCache.set(src, img)
			}

			try {
				await img.decode()
			} catch {
				return
			}

			// Не показываем устаревшее фото
			if (request !== imageRequest || selectedVariant !== current) return

			stageImg.src = src
			stageImg.alt = title + ', ' + selectedVariant.label.toLowerCase()
			currentIndex = selectedIndex

			thumbs.querySelectorAll('.thumb').forEach((thumb, i) => {
				const active = i === currentIndex
				thumb.classList.toggle('on', active)
				thumb.setAttribute('aria-current', String(active))
			})
		}

		const renderThumbs = () => {
			thumbs.replaceChildren()

			if (current.images.length < 2) return

			current.images.forEach((path, index) => {
				const button = document.createElement('button')
				button.type = 'button'
				button.className = 'thumb'
				button.setAttribute('aria-label', 'Фото ' + (index + 1))

				const image = document.createElement('img')
				image.src = path + '-t.webp'
				image.alt = ''
				image.width = 120
				image.height = 90
				image.loading = 'lazy'

				button.appendChild(image)
				button.addEventListener('click', () => show(index))
				thumbs.appendChild(button)
			})
		}

		stage.style.touchAction = 'pan-y pinch-zoom'

		stage.addEventListener('pointerdown', event => {
			if (event.pointerType === 'mouse' && event.button !== 0) return

			startX = event.clientX
			startY = event.clientY
			pointerId = event.pointerId
		})

		stage.addEventListener('pointerup', event => {
			if (pointerId !== event.pointerId) return

			const deltaX = event.clientX - startX
			const deltaY = event.clientY - startY

			startX = 0
			startY = 0
			pointerId = null

			if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2)
				return

			show(currentIndex + (deltaX < 0 ? 1 : -1))
		})

		const resetPointer = () => {
			startX = 0
			startY = 0
			pointerId = null
		}

		stage.addEventListener('pointercancel', resetPointer)
		stage.addEventListener('lostpointercapture', resetPointer)

		chips.forEach(chip => {
			chip.addEventListener('click', () => {
				const variant = variants.find(item => item.key === chip.dataset.key)

				if (!variant) return

				current = variant

				chips.forEach(item => {
					const active = item === chip
					item.classList.toggle('on', active)
					item.setAttribute('aria-pressed', String(active))
				})

				renderThumbs()
				show(0)
			})
		})

		renderThumbs()
		show(0)
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
		let touchStartX = 0
		let touchStartY = 0

		let slideTimer

		const open = i => {
			idx = (i + items.length) % items.length
			big.classList.remove('lb-slide-out-left', 'lb-slide-out-right')
			big.src = items[idx].dataset.full
			big.alt = items[idx].dataset.alt || ''

			if (!box.open) box.showModal()
		}

		const slide = direction => {
			if (slideTimer) clearTimeout(slideTimer)

			big.classList.remove('lb-slide-out-left', 'lb-slide-out-right')
			big.classList.add(
				direction === 1 ? 'lb-slide-out-left' : 'lb-slide-out-right',
			)

			slideTimer = setTimeout(() => {
				idx = (idx + direction + items.length) % items.length
				big.src = items[idx].dataset.full
				big.alt = items[idx].dataset.alt || ''

				big.classList.remove('lb-slide-out-left', 'lb-slide-out-right')
				slideTimer = null
			}, 260)
		}

		items.forEach((item, i) => {
			item.addEventListener('click', () => open(i))
		})

		document.getElementById('lbprev')?.addEventListener('click', () => {
			slide(-1)
		})

		document.getElementById('lbnext')?.addEventListener('click', () => {
			slide(1)
		})

		document.getElementById('lbclose')?.addEventListener('click', () => {
			box.close()
		})

		box.addEventListener('click', e => {
			if (e.target === box) box.close()
		})

		big.addEventListener(
			'touchstart',
			e => {
				if (e.touches.length !== 1) return

				touchStartX = e.touches[0].clientX
				touchStartY = e.touches[0].clientY
			},
			{ passive: true },
		)

		big.addEventListener(
			'touchend',
			e => {
				if (e.changedTouches.length !== 1) return

				const deltaX = e.changedTouches[0].clientX - touchStartX
				const deltaY = e.changedTouches[0].clientY - touchStartY

				if (
					Math.abs(deltaX) < 50 ||
					Math.abs(deltaX) < Math.abs(deltaY) * 1.2
				) {
					return
				}

				slide(deltaX < 0 ? 1 : -1)
			},
			{ passive: true },
		)

		box.addEventListener('close', () => {
			big.removeAttribute('src')
		})

		box.addEventListener('keydown', e => {
			if (e.key === 'ArrowLeft') slide(-1)
			if (e.key === 'ArrowRight') slide(1)
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
